/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { register as registerBetterAuth } from "@convex-dev/better-auth/test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/*
 * Staff-identity bootstrap for the `requireStaff`-gated functions under
 * test here — the first real coverage of that gate outside staff.ts's own
 * staff-management mutations (`listStaff`, `addStaffByEmail`, ...), which
 * `organizations.test.ts` already established the pattern for:
 * `devProvision.signUpStaff` creates a real Better Auth user,
 * `registerBetterAuth(t)` wires the Better Auth component in before any
 * Better-Auth-backed call, and `t.withIdentity` uses the real returned
 * `userId` (what a real session's JWT `sub` claim holds), not the email, as
 * `subject` — `vitest.config.ts` pins `CONVEX_SITE_URL` to match what
 * `buildAuthSubject` computes. `claimFirstStaffAccount` is self-limiting to
 * once per empty `staffMemberships` table, so each test's fresh `t` can use
 * it directly to become the first `cms_admin`.
 */
async function createStaffAdmin(t: ReturnType<typeof convexTest>, email: string, name: string) {
  const { userId } = await t.action(internal.devProvision.signUpStaff, {
    email,
    password: "correct-horse-battery-staple",
    name,
  });
  const asStaff = t.withIdentity({ subject: userId, issuer: "https://example.convex.site" });
  await asStaff.mutation(internal.staff.claimFirstStaffAccount, {});
  return { asStaff, authSubject: `https://example.convex.site|${userId}` };
}

/*
 * The plain email-as-subject identity helper `organizations.test.ts` and
 * `professionalOwnership.test.ts` both use for scenarios that need a stable
 * simulated session an `appUsers` row can be looked up by, but no real
 * Better Auth account — the org-owner/claimant side of every scenario below.
 */
async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

async function seedProfessional(
  t: ReturnType<typeof convexTest>,
  slug: string,
  displayName: string,
  publicationStatus: "draft" | "review" | "published" | "suspended" | "archived",
) {
  return t.run(async (ctx) =>
    ctx.db.insert("professionals", {
      slug,
      displayName,
      kind: "individual",
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus,
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    }),
  );
}

// --- (a) non-staff caller is rejected by all five functions ---------------

test("non-staff caller is rejected by all five staff review functions", async () => {
  const t = convexTest(schema, modules);

  // A pending ownership claim and a review-status professional to target —
  // the staff gate must throw before any of these are ever read.
  const professionalId = await seedProfessional(t, "non-staff-target", "Non Staff Target", "published");
  const claimant = await signedInUser(t, "claimant-nonstaff@example.com");
  const { organizationId } = await claimant.mutation(api.organizations.createOrganization, {
    name: "Claimant Org",
    kind: "professional_firm",
  });
  const { ownershipId } = await claimant.mutation(api.professionalOwnership.requestProfessionalClaim, {
    organizationId,
    professionalId,
  });
  await t.run((ctx) => ctx.db.patch(professionalId, { publicationStatus: "review" }));

  const outsider = await signedInUser(t, "outsider-nonstaff@example.com");

  await expect(outsider.query(api.staff.listPendingClaims, {})).rejects.toThrow();
  await expect(
    outsider.mutation(api.staff.decideClaim, { ownershipId, decision: "approve" }),
  ).rejects.toThrow();
  await expect(outsider.query(api.staff.listProfessionalsPendingReview, {})).rejects.toThrow();
  await expect(outsider.mutation(api.staff.publishProfessional, { professionalId })).rejects.toThrow();
  await expect(
    outsider.mutation(api.staff.rejectProfessional, { professionalId, reason: "test" }),
  ).rejects.toThrow();
});

// --- (b)/(d, partial) decideClaim approve ----------------------------------

test("decideClaim approve flips a pending claim to approved and records the decision", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff, authSubject } = await createStaffAdmin(t, "staff-approve@example.com", "Staff Approver");

  const professionalId = await seedProfessional(t, "approve-target", "Approve Target", "published");
  const claimant = await signedInUser(t, "claimant-approve@example.com");
  const { organizationId } = await claimant.mutation(api.organizations.createOrganization, {
    name: "Claimant Approve Org",
    kind: "professional_firm",
  });
  const { ownershipId } = await claimant.mutation(api.professionalOwnership.requestProfessionalClaim, {
    organizationId,
    professionalId,
  });

  const pendingClaims = await asStaff.query(api.staff.listPendingClaims, {});
  expect(pendingClaims).toHaveLength(1);
  expect(pendingClaims[0]).toMatchObject({
    _id: ownershipId,
    status: "pending",
    professionalDisplayName: "Approve Target",
    organizationName: "Claimant Approve Org",
  });

  await asStaff.mutation(api.staff.decideClaim, { ownershipId, decision: "approve" });

  const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
  expect(ownership?.status).toBe("approved");
  expect(ownership?.decidedByAuthSubject).toBe(authSubject);
  expect(ownership?.decidedAt).toBeDefined();

  // The decided claim no longer shows up in the pending queue.
  const stillPending = await asStaff.query(api.staff.listPendingClaims, {});
  expect(stillPending).toHaveLength(0);
});

// --- (c) decideClaim reject -------------------------------------------------

test("decideClaim reject flips a pending claim to revoked", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff } = await createStaffAdmin(t, "staff-reject-claim@example.com", "Staff Claim Rejector");

  const professionalId = await seedProfessional(t, "reject-claim-target", "Reject Claim Target", "published");
  const claimant = await signedInUser(t, "claimant-reject@example.com");
  const { organizationId } = await claimant.mutation(api.organizations.createOrganization, {
    name: "Claimant Reject Org",
    kind: "professional_firm",
  });
  const { ownershipId } = await claimant.mutation(api.professionalOwnership.requestProfessionalClaim, {
    organizationId,
    professionalId,
  });

  await asStaff.mutation(api.staff.decideClaim, { ownershipId, decision: "reject" });

  const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
  expect(ownership?.status).toBe("revoked");
});

// --- (d) listProfessionalsPendingReview filtering --------------------------

test("listProfessionalsPendingReview returns only review-status professionals", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff } = await createStaffAdmin(t, "staff-review-list@example.com", "Staff Lister");

  const draftId = await seedProfessional(t, "draft-pro", "Draft Pro", "draft");
  const reviewId = await seedProfessional(t, "review-pro", "Review Pro", "review");
  const publishedId = await seedProfessional(t, "published-pro", "Published Pro", "published");

  const pending = await asStaff.query(api.staff.listProfessionalsPendingReview, {});
  const ids = pending.map((p) => p._id);
  expect(ids).toContain(reviewId);
  expect(ids).not.toContain(draftId);
  expect(ids).not.toContain(publishedId);
});

// --- (e) publishProfessional's review-only guard ---------------------------

test("publishProfessional throws unless the listing is in review", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff } = await createStaffAdmin(t, "staff-publish-guard@example.com", "Staff Publisher");

  const draftId = await seedProfessional(t, "publish-guard-draft", "Publish Guard Draft", "draft");
  await expect(
    asStaff.mutation(api.staff.publishProfessional, { professionalId: draftId }),
  ).rejects.toThrow();

  const reviewId = await seedProfessional(t, "publish-guard-review", "Publish Guard Review", "review");
  await asStaff.mutation(api.staff.publishProfessional, { professionalId: reviewId });

  const published = await t.run(async (ctx) => ctx.db.get(reviewId));
  expect(published?.publicationStatus).toBe("published");
  expect(published?.approvedProfile).toBe(true);
});

// --- (f) rejectProfessional's review -> draft loop, and re-editability ----

test("rejectProfessional throws unless the listing is in review", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff } = await createStaffAdmin(t, "staff-reject-guard@example.com", "Staff Reject Guard");

  const draftId = await seedProfessional(t, "reject-guard-draft", "Reject Guard Draft", "draft");
  await expect(
    asStaff.mutation(api.staff.rejectProfessional, { professionalId: draftId, reason: "n/a" }),
  ).rejects.toThrow();
});

test("rejectProfessional sends a listing back to draft and it becomes editable again", async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  const { asStaff } = await createStaffAdmin(t, "staff-reject-pro@example.com", "Staff Rejector Pro");

  const owner = await signedInUser(t, "reject-flow-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Reject Flow Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Reject Flow CPA",
    kind: "individual",
  });

  const countryId = await t.run(async (ctx) =>
    ctx.db.insert("countries", {
      code: "US",
      name: "United States",
      defaultLocale: "en-US",
      displayCurrency: "USD",
      discoverable: true,
      onboardingEnabled: true,
      transactionEnabled: false,
      paymentEnabled: false,
      status: "published",
      updatedAt: Date.now(),
    }),
  );
  await owner.mutation(api.professionalOwnership.setProfessionalLocations, {
    professionalId,
    locations: [{ countryId, city: "Austin", isPrimary: true }],
  });
  await owner.mutation(api.professionalOwnership.submitForReview, { professionalId });

  let professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("review");

  await asStaff.mutation(api.staff.rejectProfessional, {
    professionalId,
    reason: "Bio needs more detail.",
  });

  professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("draft");

  // Re-editability: rejecting is non-terminal — a Task 6 wizard mutation
  // (gated on `publicationStatus === "draft"`) succeeds again post-reject.
  await owner.mutation(api.professionalOwnership.updateProfessionalBasics, {
    professionalId,
    displayName: "Reject Flow CPA Updated",
    kind: "individual",
    bio: "Updated after rejection feedback.",
    remoteServices: false,
    publicContactMode: "contact_form",
  });

  professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.displayName).toBe("Reject Flow CPA Updated");
});
