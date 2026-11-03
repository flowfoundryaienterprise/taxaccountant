/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { register as registerBetterAuth } from "@convex-dev/better-auth/test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

test("createOrganization makes the caller the owner", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "firm-owner@example.com");

  const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const orgs = await asUser.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(1);
  expect(orgs[0]).toMatchObject({ organizationId, name: "Acme Tax LLP", role: "owner" });
});

test("currentOrganizations is empty for a user with no org", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "nobody@example.com");
  expect(await asUser.query(api.organizations.currentOrganizations, {})).toEqual([]);
});

test("createOrganization requires sign-in", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.organizations.createOrganization, { name: "X", kind: "customer_business" }),
  ).rejects.toThrow();
});

/*
 * --- Task 4: invite / accept / decline / remove -------------------------
 *
 * `registerBetterAuth(t)` must run before any call that touches the Better
 * Auth component (`devProvision.signUpStaff`, or `inviteMember`'s own
 * adapter lookup) — same requirement `healthCheck.test.ts` documents.
 *
 * A real invitee's session is simulated with
 * `t.withIdentity({ subject: <the Better Auth user's own id>, issuer: "https://example.convex.site" })`,
 * never `subject: <email>`. `buildAuthSubject` (duplicated below from
 * `convex/staff.ts:44-49`) builds `authSubject` as
 * `${CONVEX_SITE_URL}|${betterAuthUserId}`, and Convex's `tokenIdentifier`
 * is `${issuer}|${subject}` — so for `inviteMember`'s provisioned `appUsers`
 * row to ever be found by the invitee's own later session, the simulated
 * session's `subject` has to be that same Better Auth user id (what a real
 * session's JWT `sub` claim actually holds), not their email. This is a
 * deliberate correction to the email-as-subject shape the plan's own Step 1
 * sample code used for this scenario — confirmed empirically: a probe
 * mutation showed `devProvision.signUpStaff`-created users get a real
 * generated id (not their email), and `CONVEX_SITE_URL` is unset by default
 * in convex-test's sandbox (now pinned in `vitest.config.ts`). `signedInUser`
 * above intentionally keeps using email-as-subject — it never creates a real
 * Better Auth account, so nothing needs its fake identity to match one.
 */

test("inviteMember creates an invited membership for a user who already has an appUsers row", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner-a@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email: "member-a@example.com",
    password: "correct-horse-battery-staple",
    name: "Member A",
  });
  const asMember = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asMember.mutation(api.users.ensureAppUser, {});

  const { membershipId } = await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "member-a@example.com",
    role: "member",
  });

  const membership = await t.run(async (ctx) => ctx.db.get(membershipId));
  expect(membership?.status).toBe("invited");
  expect(membership?.role).toBe("member");

  // No duplicate appUsers row was created for the invitee: one for the
  // owner (from signedInUser's ensureAppUser call), one for member-a.
  const appUsers = await t.run(async (ctx) => ctx.db.query("appUsers").collect());
  expect(appUsers).toHaveLength(2);
});

test("inviteMember provisions appUsers for a Better Auth account with no appUsers row yet", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  // Invitee has a Better Auth account but has never called ensureAppUser.
  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email: "invitee@example.com",
    password: "correct-horse-battery-staple",
    name: "Invitee",
  });

  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "invitee@example.com",
    role: "member",
  });

  const asInvitee = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asInvitee.mutation(api.organizations.acceptInvite, { organizationId });
  const orgs = await asInvitee.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(1);
});

test("inviteMember throws for an email with no Better Auth account", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner2@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });
  await expect(
    owner.mutation(api.organizations.inviteMember, {
      organizationId,
      email: "nobody@example.com",
      role: "member",
    }),
  ).rejects.toThrow();
});

test("a viewer cannot invite new members", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "owner-d@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  // Set up a viewer's active membership directly: inviteMember itself
  // requires a real Better Auth account, which is irrelevant to what this
  // test checks (the role guard), so wiring it through the real invite flow
  // would only add unrelated Better Auth setup noise.
  const viewer = await signedInUser(t, "viewer-d@example.com");
  const viewerUser = await t.run(async (ctx) =>
    ctx.db
      .query("appUsers")
      .withIndex("by_auth_subject", (q) =>
        q.eq("authSubject", "https://example.convex.site|viewer-d@example.com"),
      )
      .unique(),
  );
  if (!viewerUser) throw new Error("test setup failed: viewer appUsers row missing");
  await t.run((ctx) =>
    ctx.db.insert("organizationMembers", {
      organizationId,
      userId: viewerUser._id,
      role: "viewer",
      status: "active",
      createdAt: Date.now(),
    }),
  );

  await expect(
    viewer.mutation(api.organizations.inviteMember, {
      organizationId,
      email: "anyone@example.com",
      role: "member",
    }),
  ).rejects.toThrow();
});

test("re-inviting an already-active member keeps them active and does not change their role", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner-e@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email: "member-e@example.com",
    password: "correct-horse-battery-staple",
    name: "Member E",
  });

  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "member-e@example.com",
    role: "admin",
  });
  const asMember = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asMember.mutation(api.organizations.acceptInvite, { organizationId });

  // Re-invite with a different (lower) role: must not demote or duplicate.
  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "member-e@example.com",
    role: "viewer",
  });

  const memberRows = await t.run(async (ctx) =>
    ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect(),
  );
  const nonOwnerRows = memberRows.filter((row) => row.role !== "owner");
  expect(nonOwnerRows).toHaveLength(1);
  expect(nonOwnerRows[0].status).toBe("active");
  expect(nonOwnerRows[0].role).toBe("admin");
});

test("declineInvite removes the pending membership", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner-decline@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email: "decliner@example.com",
    password: "correct-horse-battery-staple",
    name: "Decliner",
  });
  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "decliner@example.com",
    role: "member",
  });

  const asDecliner = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asDecliner.mutation(api.organizations.declineInvite, { organizationId });

  const orgs = await asDecliner.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(0);
  const membership = await t.run(async (ctx) =>
    ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect(),
  );
  expect(membership.filter((row) => row.role !== "owner")).toHaveLength(0);
});

test("removeMember marks an active member removed", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const owner = await signedInUser(t, "owner-remove@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email: "removable@example.com",
    password: "correct-horse-battery-staple",
    name: "Removable",
  });
  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "removable@example.com",
    role: "member",
  });
  const asMember = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asMember.mutation(api.organizations.acceptInvite, { organizationId });
  const beforeRemoval = await asMember.query(api.organizations.currentOrganizations, {});
  expect(beforeRemoval).toHaveLength(1);

  await owner.mutation(api.organizations.removeMember, {
    membershipId: beforeRemoval[0].membershipId,
  });

  const afterRemoval = await asMember.query(api.organizations.currentOrganizations, {});
  expect(afterRemoval).toHaveLength(0);
});

test("removeMember refuses to remove the sole owner", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "owner3@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });
  const orgs = await owner.query(api.organizations.currentOrganizations, {});
  await expect(
    owner.mutation(api.organizations.removeMember, { membershipId: orgs[0].membershipId }),
  ).rejects.toThrow();
});
