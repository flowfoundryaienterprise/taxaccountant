import { v } from "convex/values";

import { requireOrgRole } from "./organizations";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { requireStaff } from "./staff";
import type { Id } from "./_generated/dataModel";

/**
 * Stripe billing — the Convex half that is plain queries/mutations with
 * normal `ctx.db` access (no Stripe network calls, no Node runtime). The
 * actual Stripe SDK calls and the webhook handler live in
 * `convex/stripeNode.ts` ("use node"), which calls into this file via
 * `ctx.runQuery`/`ctx.runMutation` for every read or write of
 * `professionalSubscriptions`/`stripeWebhookEvents` — the same
 * split devProvision.ts already uses for "needs Node APIs" vs "needs
 * `ctx.db`" (Convex actions get one or the other, never both in the
 * default runtime).
 */

export type SubscriptionCategory =
  | "cpa_accountant"
  | "tax_attorney"
  | "bookkeeper"
  | "wealth_advisor";

/**
 * Monthly price, in whole USD — brief section 8's table, reproduced here
 * once so the UI and the Stripe Price ID lookup can never disagree about
 * which category costs what. This is display data only: a checkout
 * session is priced by the Stripe Price ID resolved server-side in
 * `stripeNode.ts`, never by a client-supplied amount (brief section 8:
 * "Never accept subscription price amounts supplied by the browser").
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionCategory, { label: string; monthlyUsd: number }> = {
  cpa_accountant: { label: "CPA / Accountant", monthlyUsd: 299 },
  tax_attorney: { label: "Tax Attorney", monthlyUsd: 299 },
  bookkeeper: { label: "Bookkeeper", monthlyUsd: 199 },
  wealth_advisor: { label: "Wealth Advisor", monthlyUsd: 499 },
};

/** Convex deployment env var holding each category's live Stripe Price ID. */
const PRICE_ENV_VAR: Record<SubscriptionCategory, string> = {
  cpa_accountant: "STRIPE_PRICE_CPA_ACCOUNTANT",
  tax_attorney: "STRIPE_PRICE_TAX_ATTORNEY",
  bookkeeper: "STRIPE_PRICE_BOOKKEEPER",
  wealth_advisor: "STRIPE_PRICE_WEALTH_ADVISOR",
};

export function resolvePriceId(category: SubscriptionCategory): string | undefined {
  return process.env[PRICE_ENV_VAR[category]];
}

/**
 * Shared auth gate for every billing action: only an `owner`/`admin` of
 * the `professional_firm` organization being billed may start a checkout,
 * open the billing portal, or (more loosely, any active member) view its
 * subscription — mirrors `requireProfessionalEditAccess`'s reasoning in
 * `professionalOwnership.ts`, one level up the ownership chain.
 */
async function requireProfessionalFirmRole(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  roles: Array<"owner" | "admin" | "member" | "viewer">,
) {
  const { organization, membership, user } = await requireOrgRole(ctx, organizationId, roles);
  if (organization.kind !== "professional_firm") {
    throw new Error("Only a professional firm organization can hold a subscription.");
  }
  return { organization, membership, user };
}

async function findSubscriptionRow(ctx: QueryCtx, organizationId: Id<"organizations">) {
  return ctx.db
    .query("professionalSubscriptions")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .unique();
}

/** Internal: auth check callable from `stripeNode.ts`'s actions via `ctx.runQuery`. */
export const assertBillingRole = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    roles: v.array(
      v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.literal("viewer")),
    ),
  },
  handler: async (ctx, args) => {
    await requireProfessionalFirmRole(ctx, args.organizationId, args.roles);
    return null;
  },
});

/** Internal: read the existing billing row for an org, or `null`. Used by `stripeNode.ts` to reuse a Stripe customer across checkout attempts. */
export const getSubscriptionRowInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => findSubscriptionRow(ctx, args.organizationId),
});

/**
 * Internal: create-or-update the billing row from a checkout session that
 * was just started. Never sets `status` to `active` — only the webhook
 * (`applyWebhookEvent` below), driven by Stripe's own event, may do that
 * (brief section 8: "Do not grant paid subscription entitlements solely
 * from a checkout success URL").
 */
export const recordCheckoutStarted = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    category: v.union(
      v.literal("cpa_accountant"),
      v.literal("tax_attorney"),
      v.literal("bookkeeper"),
      v.literal("wealth_advisor"),
    ),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await findSubscriptionRow(ctx, args.organizationId);
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        category: args.category,
        stripeCustomerId: args.stripeCustomerId,
        stripePriceId: args.stripePriceId,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("professionalSubscriptions", {
      organizationId: args.organizationId,
      category: args.category,
      stripeCustomerId: args.stripeCustomerId,
      stripePriceId: args.stripePriceId,
      status: "incomplete",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Internal: idempotency guard. Inserts the event id and reports whether it
 * was already present — `stripeNode.ts`'s webhook handler must call this
 * first and skip reprocessing when it returns `true` (brief section 8:
 * "Handle duplicate webhook events idempotently"). The insert and the
 * check happen in one mutation so two near-simultaneous deliveries of the
 * same event can't both read "not yet processed".
 */
export const recordWebhookEventOnce = internalMutation({
  args: { stripeEventId: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
      .unique();
    if (existing) return { alreadyProcessed: true };

    await ctx.db.insert("stripeWebhookEvents", {
      stripeEventId: args.stripeEventId,
      type: args.type,
      processedAt: Date.now(),
    });
    return { alreadyProcessed: false };
  },
});

/**
 * Internal: apply a Stripe subscription's current state to the matching
 * `professionalSubscriptions` row, looked up by `stripeCustomerId` (every
 * subscription/invoice event Stripe sends carries the customer id, not
 * the Convex organization id). Upserts rather than requiring the row to
 * already exist, because `checkout.session.completed` can in principle
 * arrive before `recordCheckoutStarted`'s own write is visible to a
 * separate webhook delivery.
 */
export const applySubscriptionState = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.optional(v.string()),
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("paused"),
    ),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("professionalSubscriptions")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();

    const now = Date.now();
    const patch = {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    // No row yet — either a Stripe subscription created outside this
    // app's own checkout flow, or (in principle) a webhook that arrived
    // before `recordCheckoutStarted`'s own write landed. `organizationId`
    // and `category` genuinely are not known from a subscription event
    // alone, so this row stays unattached and uncategorized until
    // `adminAttachSubscriptionOrganization` fills them in — never guessed
    // at; the alternative (refusing to record Stripe's own event) would
    // mean losing the status update entirely.
    return ctx.db.insert("professionalSubscriptions", {
      organizationId: undefined,
      category: undefined,
      ...patch,
      stripeCustomerId: args.stripeCustomerId,
      createdAt: now,
    });
  },
});

/**
 * Which categories actually have a live Stripe Price ID configured on
 * this deployment — lets the subscription screen show "not yet
 * available" per category honestly instead of letting someone click
 * Subscribe and hit an opaque action error (DESIGN.md's "future-phase
 * features must display honest availability" rule, applied to billing).
 * No secret values leave the server: booleans only.
 */
export const billingAvailability = query({
  args: {},
  handler: async () => {
    const result: Record<SubscriptionCategory, boolean> = {
      cpa_accountant: false,
      tax_attorney: false,
      bookkeeper: false,
      wealth_advisor: false,
    };
    for (const category of Object.keys(result) as SubscriptionCategory[]) {
      result[category] = Boolean(resolvePriceId(category));
    }
    return result;
  },
});

/** The signed-in caller's subscription for one of their professional firms, or `null`. */
export const mySubscription = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireProfessionalFirmRole(ctx, args.organizationId, ["owner", "admin", "member", "viewer"]);
    return findSubscriptionRow(ctx, args.organizationId);
  },
});

/**
 * Every subscription row, for the admin dashboard (brief section 8:
 * "Admin dashboard displays subscription records"). Staff-gated like
 * every other admin read; joins in the organization name since a bare
 * `professionalSubscriptions` row only has an id.
 */
export const adminListSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const rows = await ctx.db.query("professionalSubscriptions").order("desc").collect();
    return Promise.all(
      rows.map(async (row) => {
        const organization = row.organizationId ? await ctx.db.get(row.organizationId) : null;
        return {
          _id: row._id,
          organizationName: organization?.name ?? "(unmatched Stripe customer)",
          category: row.category,
          status: row.status,
          currentPeriodEnd: row.currentPeriodEnd,
          cancelAtPeriodEnd: row.cancelAtPeriodEnd,
          updatedAt: row.updatedAt,
        };
      }),
    );
  },
});

/**
 * Staff-only correction for the "unmatched Stripe customer" case above —
 * attaches a placeholder row (created by a webhook that beat
 * `recordCheckoutStarted`) to the organization it actually belongs to,
 * once an admin has identified it from the Stripe dashboard. Never
 * changes `status`: that stays Stripe's own event data.
 */
export const adminAttachSubscriptionOrganization = mutation({
  args: {
    subscriptionId: v.id("professionalSubscriptions"),
    organizationId: v.id("organizations"),
    category: v.union(
      v.literal("cpa_accountant"),
      v.literal("tax_attorney"),
      v.literal("bookkeeper"),
      v.literal("wealth_advisor"),
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const organization = await ctx.db.get(args.organizationId);
    if (!organization || organization.kind !== "professional_firm") {
      throw new Error("Target must be an existing professional firm organization.");
    }
    await ctx.db.patch(args.subscriptionId, {
      organizationId: args.organizationId,
      category: args.category,
      updatedAt: Date.now(),
    });
  },
});
