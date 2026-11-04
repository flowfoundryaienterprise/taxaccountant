/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

// --- assertBillingRole rejects a customer_business organization ---

test("assertBillingRole rejects a customer_business organization", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "customer-org-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Customer Co",
    kind: "customer_business",
  });

  await expect(
    owner.query(internal.stripeBilling.assertBillingRole, {
      organizationId,
      roles: ["owner", "admin"],
    }),
  ).rejects.toThrow(/professional firm/);
});

// --- assertBillingRole rejects a non-member ---

test("assertBillingRole rejects a caller with no membership in the organization", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "firm-owner-2@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const stranger = await signedInUser(t, "stranger@example.com");
  await expect(
    stranger.query(internal.stripeBilling.assertBillingRole, {
      organizationId,
      roles: ["owner", "admin"],
    }),
  ).rejects.toThrow(/Not an active member/);
});

// --- assertBillingRole rejects a viewer when owner/admin is required ---

test("assertBillingRole rejects a viewer role when only owner/admin may act", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "firm-owner-3@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const viewer = await signedInUser(t, "viewer@example.com");
  await t.run(async (ctx) => {
    const viewerUser = await ctx.db
      .query("appUsers")
      .withIndex("by_auth_subject", (q) =>
        q.eq("authSubject", "https://example.convex.site|viewer@example.com"),
      )
      .unique();
    if (!viewerUser) throw new Error("test setup: viewer appUsers row missing");
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: viewerUser._id,
      role: "viewer",
      status: "active",
      createdAt: Date.now(),
    });
  });

  await expect(
    viewer.query(internal.stripeBilling.assertBillingRole, {
      organizationId,
      roles: ["owner", "admin"],
    }),
  ).rejects.toThrow(/permission/);
});

// --- recordWebhookEventOnce is idempotent ---

test("recordWebhookEventOnce only reports a Stripe event id as new once", async () => {
  const t = convexTest(schema, modules);

  const first = await t.mutation(internal.stripeBilling.recordWebhookEventOnce, {
    stripeEventId: "evt_test_123",
    type: "customer.subscription.updated",
  });
  expect(first.alreadyProcessed).toBe(false);

  const second = await t.mutation(internal.stripeBilling.recordWebhookEventOnce, {
    stripeEventId: "evt_test_123",
    type: "customer.subscription.updated",
  });
  expect(second.alreadyProcessed).toBe(true);

  const rows = await t.run(async (ctx) =>
    ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", "evt_test_123"))
      .collect(),
  );
  expect(rows).toHaveLength(1);
});

// --- applySubscriptionState upserts by stripeCustomerId ---

test("applySubscriptionState creates one row per Stripe customer and updates it in place on the next event", async () => {
  const t = convexTest(schema, modules);

  const firstId = await t.mutation(internal.stripeBilling.applySubscriptionState, {
    stripeCustomerId: "cus_test_abc",
    stripeSubscriptionId: "sub_test_abc",
    status: "incomplete",
  });

  const secondId = await t.mutation(internal.stripeBilling.applySubscriptionState, {
    stripeCustomerId: "cus_test_abc",
    stripeSubscriptionId: "sub_test_abc",
    status: "active",
    currentPeriodEnd: 1_700_000_000_000,
  });

  expect(secondId).toBe(firstId);

  const row = await t.run(async (ctx) => ctx.db.get(firstId));
  expect(row?.status).toBe("active");
  expect(row?.currentPeriodEnd).toBe(1_700_000_000_000);
  // Created with no matching `recordCheckoutStarted` row yet, so these stay unset.
  expect(row?.organizationId).toBeUndefined();
  expect(row?.category).toBeUndefined();
});

// --- recordCheckoutStarted + applySubscriptionState attach correctly for the normal flow ---

test("a checkout-started row is the one applySubscriptionState later updates for the same customer", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "firm-owner-4@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const subscriptionId = await t.mutation(internal.stripeBilling.recordCheckoutStarted, {
    organizationId,
    category: "cpa_accountant",
    stripeCustomerId: "cus_test_xyz",
    stripePriceId: "price_test_xyz",
  });

  const updatedId = await t.mutation(internal.stripeBilling.applySubscriptionState, {
    stripeCustomerId: "cus_test_xyz",
    stripeSubscriptionId: "sub_test_xyz",
    status: "active",
  });

  expect(updatedId).toBe(subscriptionId);

  const row = await t.run(async (ctx) => ctx.db.get(subscriptionId));
  expect(row?.organizationId).toBe(organizationId);
  expect(row?.category).toBe("cpa_accountant");
  expect(row?.status).toBe("active");
});

// --- mySubscription rejects a non-member ---

test("mySubscription rejects a caller with no membership in the organization", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "firm-owner-5@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const stranger = await signedInUser(t, "stranger-2@example.com");
  await expect(stranger.query(api.stripeBilling.mySubscription, { organizationId })).rejects.toThrow(
    /Not an active member/,
  );
});

// --- adminListSubscriptions rejects non-staff ---

test("adminListSubscriptions rejects a caller with no staff role", async () => {
  const t = convexTest(schema, modules);
  const nonStaff = await signedInUser(t, "not-staff@example.com");
  await expect(nonStaff.query(api.stripeBilling.adminListSubscriptions, {})).rejects.toThrow();
});

// --- billingAvailability reports false when no Stripe price env vars are set ---

test("billingAvailability reports every category unavailable with no Stripe env vars configured", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.stripeBilling.billingAvailability, {});
  expect(result).toEqual({
    cpa_accountant: false,
    tax_attorney: false,
    bookkeeper: false,
    wealth_advisor: false,
  });
});
