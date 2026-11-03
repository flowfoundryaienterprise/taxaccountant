/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";
import { requireProfessionalEditAccess } from "./professionalOwnership";

const modules = import.meta.glob("./**/*.ts");

/*
 * `signedInUser` is deliberately the same email-as-subject helper
 * `organizations.test.ts` uses (not a real Better Auth account via
 * `devProvision.signUpStaff`): none of this task's scenarios need a real
 * Better Auth identity, only a stable simulated session an `appUsers` row
 * can be looked up by.
 */
async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

// --- (a) createProfessionalDraft succeeds for a professional_firm owner ---

test("createProfessionalDraft creates a draft professional and an approved ownership row", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "firm-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Jane Doe CPA",
    kind: "individual",
  });

  const professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("draft");
  expect(professional?.verificationStatus).toBe("not_reviewed");
  expect(professional?.approvedProfile).toBe(false);
  expect(professional?.displayName).toBe("Jane Doe CPA");
  expect(professional?.slug).toBe("jane-doe-cpa");

  const ownershipRows = await t.run(async (ctx) =>
    ctx.db
      .query("professionalOwnership")
      .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
      .collect(),
  );
  expect(ownershipRows).toHaveLength(1);
  expect(ownershipRows[0].status).toBe("approved");
  expect(ownershipRows[0].organizationId).toBe(organizationId);
});

// --- (b) createProfessionalDraft rejects a customer_business org (Review Focus 2) ---

test("createProfessionalDraft rejects a customer_business org", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "customer@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Jane's Bakery",
    kind: "customer_business",
  });
  await expect(
    owner.mutation(api.professionalOwnership.createProfessionalDraft, {
      organizationId,
      displayName: "Jane Doe CPA",
      kind: "individual",
    }),
  ).rejects.toThrow();
});

// --- (c) createProfessionalDraft rejects a viewer (Review Focus 3) ---

test("createProfessionalDraft rejects a viewer", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "viewer-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  // Wire up a viewer's active membership directly, same shortcut
  // organizations.test.ts's "a viewer cannot invite new members" test uses:
  // the real invite flow needs a Better Auth account, which is irrelevant to
  // what this test checks (the role guard).
  const viewer = await signedInUser(t, "viewer-only@example.com");
  const viewerUser = await t.run(async (ctx) =>
    ctx.db
      .query("appUsers")
      .withIndex("by_auth_subject", (q) =>
        q.eq("authSubject", "https://example.convex.site|viewer-only@example.com"),
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
    viewer.mutation(api.professionalOwnership.createProfessionalDraft, {
      organizationId,
      displayName: "Should Not Be Created",
      kind: "individual",
    }),
  ).rejects.toThrow();
});

// --- requestProfessionalClaim shares createProfessionalDraft's role+kind
// guard (Review Focus 2 and 3 name both mutations); mirrors the two tests
// above for that same guard, on requestProfessionalClaim instead. ---

test("requestProfessionalClaim rejects a customer_business org", async () => {
  const t = convexTest(schema, modules);

  // An existing, unclaimed directory listing to target the claim at — the
  // guard throws before this row is ever looked up, but a real id keeps the
  // test from depending on that ordering.
  const professionalId = await t.run(async (ctx) =>
    ctx.db.insert("professionals", {
      slug: "claim-target-customer-business",
      displayName: "Claim Target",
      kind: "individual",
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus: "published",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    }),
  );

  const owner = await signedInUser(t, "claim-customer@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Jane's Bakery",
    kind: "customer_business",
  });

  await expect(
    owner.mutation(api.professionalOwnership.requestProfessionalClaim, {
      organizationId,
      professionalId,
    }),
  ).rejects.toThrow();
});

test("requestProfessionalClaim rejects a viewer", async () => {
  const t = convexTest(schema, modules);

  const professionalId = await t.run(async (ctx) =>
    ctx.db.insert("professionals", {
      slug: "claim-target-viewer",
      displayName: "Claim Target",
      kind: "individual",
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus: "published",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    }),
  );

  const owner = await signedInUser(t, "claim-viewer-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  // Same directly-inserted active viewer membership shortcut as
  // "createProfessionalDraft rejects a viewer" above.
  const viewer = await signedInUser(t, "claim-viewer-only@example.com");
  const viewerUser = await t.run(async (ctx) =>
    ctx.db
      .query("appUsers")
      .withIndex("by_auth_subject", (q) =>
        q.eq("authSubject", "https://example.convex.site|claim-viewer-only@example.com"),
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
    viewer.mutation(api.professionalOwnership.requestProfessionalClaim, {
      organizationId,
      professionalId,
    }),
  ).rejects.toThrow();
});

// --- (d) requestProfessionalClaim creates a pending row with no edit access ---

test("requestProfessionalClaim creates a pending ownership row that grants no edit access while pending", async () => {
  const t = convexTest(schema, modules);

  // An existing, unclaimed directory listing (e.g. staff-seeded), with no
  // professionalOwnership row at all yet.
  const professionalId = await t.run(async (ctx) =>
    ctx.db.insert("professionals", {
      slug: "unclaimed-cpa",
      displayName: "Unclaimed CPA",
      kind: "individual",
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus: "published",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    }),
  );

  const claimant = await signedInUser(t, "claimant@example.com");
  const { organizationId } = await claimant.mutation(api.organizations.createOrganization, {
    name: "Claimant Org",
    kind: "professional_firm",
  });

  const { ownershipId } = await claimant.mutation(api.professionalOwnership.requestProfessionalClaim, {
    organizationId,
    professionalId,
  });

  const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
  expect(ownership?.status).toBe("pending");
  expect(ownership?.organizationId).toBe(organizationId);

  await expect(
    claimant.run((ctx) => requireProfessionalEditAccess(ctx, professionalId)),
  ).rejects.toThrow();
});

// --- (e) requestProfessionalClaim rejects an already-approved professional (Review Focus 5) ---

test("requestProfessionalClaim rejects a professional that already has an approved owner", async () => {
  const t = convexTest(schema, modules);
  const firstOrg = await signedInUser(t, "firm-a@example.com");
  const { organizationId: orgA } = await firstOrg.mutation(api.organizations.createOrganization, {
    name: "Firm A",
    kind: "professional_firm",
  });
  const { professionalId } = await firstOrg.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId: orgA,
    displayName: "Firm A Lead",
    kind: "individual",
  });

  const secondOrg = await signedInUser(t, "firm-b@example.com");
  const { organizationId: orgB } = await secondOrg.mutation(api.organizations.createOrganization, {
    name: "Firm B",
    kind: "professional_firm",
  });
  await expect(
    secondOrg.mutation(api.professionalOwnership.requestProfessionalClaim, {
      organizationId: orgB,
      professionalId,
    }),
  ).rejects.toThrow();
});

// --- (f) requireProfessionalEditAccess rejects an unrelated org (Review Focus 1) ---

test("requireProfessionalEditAccess rejects a caller whose org does not own the professional", async () => {
  const t = convexTest(schema, modules);
  const owningOrg = await signedInUser(t, "listing-owner@example.com");
  const { organizationId: ownerOrgId } = await owningOrg.mutation(api.organizations.createOrganization, {
    name: "Listing Owner Org",
    kind: "professional_firm",
  });
  const { professionalId } = await owningOrg.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId: ownerOrgId,
    displayName: "Owned Listing",
    kind: "individual",
  });

  const outsider = await signedInUser(t, "outsider@example.com");
  await outsider.mutation(api.organizations.createOrganization, {
    name: "Outsider Org",
    kind: "professional_firm",
  });

  await expect(
    outsider.run((ctx) => requireProfessionalEditAccess(ctx, professionalId)),
  ).rejects.toThrow();
});

// --- extra coverage: searchPublishedProfessionals (convex/professionals.ts) ---

test("searchPublishedProfessionals only matches published listings by name substring", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("professionals", {
      slug: "jane-doe-cpa",
      displayName: "Jane Doe CPA",
      kind: "individual",
      bio: "",
      approvedProfile: true,
      verificationStatus: "verified",
      publicationStatus: "published",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("professionals", {
      slug: "draft-jane",
      displayName: "Jane Smith EA",
      kind: "individual",
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus: "draft",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: Date.now(),
    });
  });

  const results = await t.query(api.professionals.searchPublishedProfessionals, {
    nameQuery: "jane",
  });
  expect(results).toHaveLength(1);
  expect(results[0].displayName).toBe("Jane Doe CPA");
});

// ---------------------------------------------------------------------------
// Task 6: onboarding wizard step mutations
// ---------------------------------------------------------------------------

async function seedServiceAndJurisdiction(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const countryId = await ctx.db.insert("countries", {
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
    });
    const taxJurisdictionId = await ctx.db.insert("taxJurisdictions", {
      code: "US-FED",
      countryId,
      label: "US Federal",
      level: "national",
      active: true,
    });
    const serviceId = await ctx.db.insert("serviceCategories", {
      slug: "individual-tax-returns",
      name: "Individual Tax Returns",
      summary: "Preparation and filing of individual income tax returns.",
      sortOrder: 1,
      publicationStatus: "published",
      seo: {},
    });
    const languageId = await ctx.db.insert("languages", {
      code: "en",
      label: "English",
      enabled: true,
    });
    return { countryId, taxJurisdictionId, serviceId, languageId };
  });
}

// --- (a) happy path through all wizard steps to submitForReview ---

test("onboarding wizard: happy path through all steps reaches review", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Wizard Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Wizard CPA",
    kind: "individual",
  });

  const { countryId, taxJurisdictionId, serviceId, languageId } =
    await seedServiceAndJurisdiction(t);

  await owner.mutation(api.professionalOwnership.updateProfessionalBasics, {
    professionalId,
    displayName: "Wizard CPA Updated",
    kind: "individual",
    bio: "Experienced CPA serving individuals and small businesses.",
    remoteServices: true,
    publicContactMode: "contact_form",
  });

  await owner.mutation(api.professionalOwnership.setProfessionalServices, {
    professionalId,
    services: [{ serviceId, taxJurisdictionId, remote: true, description: "Full-service tax prep." }],
  });

  await owner.mutation(api.professionalOwnership.setProfessionalLocations, {
    professionalId,
    locations: [{ countryId, city: "Austin", region: "TX", isPrimary: true }],
  });

  await owner.mutation(api.professionalOwnership.setProfessionalLanguages, {
    professionalId,
    languageIds: [languageId],
  });

  const { credentialId } = await owner.mutation(api.professionalOwnership.addPublicCredential, {
    professionalId,
    designation: "CPA",
    issuer: "State Board of Accountancy",
  });
  expect(credentialId).toBeDefined();

  await owner.mutation(api.professionalOwnership.submitForReview, { professionalId });

  const professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("review");
  expect(professional?.displayName).toBe("Wizard CPA Updated");

  const services = await t.run(async (ctx) =>
    ctx.db
      .query("professionalServices")
      .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
      .collect(),
  );
  expect(services).toHaveLength(1);

  const locations = await t.run(async (ctx) =>
    ctx.db
      .query("professionalLocations")
      .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
      .collect(),
  );
  expect(locations).toHaveLength(1);

  const languages = await t.run(async (ctx) =>
    ctx.db
      .query("professionalLanguages")
      .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
      .collect(),
  );
  expect(languages).toHaveLength(1);

  const credentials = await t.run(async (ctx) =>
    ctx.db
      .query("professionalPublicCredentials")
      .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
      .collect(),
  );
  expect(credentials).toHaveLength(1);
  expect(credentials[0].publicDisplayStatus).toBe("unverified");
});

// --- (b) cross-org rejection: caller's org doesn't own the professional ---

test("wizard-step mutations reject a caller whose org does not own the professional", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-ownerb@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Owning Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Owned CPA",
    kind: "individual",
  });

  const outsider = await signedInUser(t, "wizard-outsider@example.com");
  await outsider.mutation(api.organizations.createOrganization, {
    name: "Outsider Firm",
    kind: "professional_firm",
  });

  await expect(
    outsider.mutation(api.professionalOwnership.updateProfessionalBasics, {
      professionalId,
      displayName: "Hijacked",
      kind: "individual",
      bio: "",
      remoteServices: false,
      publicContactMode: "none",
    }),
  ).rejects.toThrow();
});

// --- (c) submitForReview's required-fields guard ---

test("submitForReview rejects when no services or locations have been set", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-guard@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Guard Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Guard CPA",
    kind: "individual",
  });

  await expect(
    owner.mutation(api.professionalOwnership.submitForReview, { professionalId }),
  ).rejects.toThrow();
});

// Services-only and locations-only are each independently sufficient — a
// purely remote professional (services configured, no physical location)
// and a purely in-person professional (location configured, no services
// yet) must both be able to submit for review; only "neither" blocks it.

test("submitForReview succeeds with services configured and no locations (remote-only professional)", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-remote-only@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Remote Only Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Remote Only CPA",
    kind: "individual",
  });

  const { taxJurisdictionId, serviceId } = await seedServiceAndJurisdiction(t);
  await owner.mutation(api.professionalOwnership.setProfessionalServices, {
    professionalId,
    services: [{ serviceId, taxJurisdictionId, remote: true }],
  });

  await owner.mutation(api.professionalOwnership.submitForReview, { professionalId });

  const professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("review");
});

test("submitForReview succeeds with a location configured and no services", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-location-only@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Location Only Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Location Only CPA",
    kind: "individual",
  });

  const { countryId } = await seedServiceAndJurisdiction(t);
  await owner.mutation(api.professionalOwnership.setProfessionalLocations, {
    professionalId,
    locations: [{ countryId, city: "Austin", isPrimary: true }],
  });

  await owner.mutation(api.professionalOwnership.submitForReview, { professionalId });

  const professional = await t.run(async (ctx) => ctx.db.get(professionalId));
  expect(professional?.publicationStatus).toBe("review");
});

test("submitForReview rejects when displayName is blank even if services and locations exist", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-guard-name@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Guard Name Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Temp Name",
    kind: "individual",
  });

  const { countryId, taxJurisdictionId, serviceId } = await seedServiceAndJurisdiction(t);
  await owner.mutation(api.professionalOwnership.setProfessionalServices, {
    professionalId,
    services: [{ serviceId, taxJurisdictionId, remote: true }],
  });
  await owner.mutation(api.professionalOwnership.setProfessionalLocations, {
    professionalId,
    locations: [{ countryId, city: "Austin", isPrimary: true }],
  });

  // Blank the display name directly — updateProfessionalBasics has no
  // non-empty guard of its own; only submitForReview enforces one.
  await t.run((ctx) => ctx.db.patch(professionalId, { displayName: "   " }));

  await expect(
    owner.mutation(api.professionalOwnership.submitForReview, { professionalId }),
  ).rejects.toThrow();
});

// --- (d) rejection when publicationStatus isn't "draft" ---

test("wizard-step mutations reject editing a listing that is already in review", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "wizard-review@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Review Firm",
    kind: "professional_firm",
  });
  const { professionalId } = await owner.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId,
    displayName: "Review CPA",
    kind: "individual",
  });

  const { countryId, taxJurisdictionId, serviceId } = await seedServiceAndJurisdiction(t);
  await owner.mutation(api.professionalOwnership.setProfessionalServices, {
    professionalId,
    services: [{ serviceId, taxJurisdictionId, remote: true }],
  });
  await owner.mutation(api.professionalOwnership.setProfessionalLocations, {
    professionalId,
    locations: [{ countryId, city: "Austin", isPrimary: true }],
  });
  await owner.mutation(api.professionalOwnership.submitForReview, { professionalId });

  await expect(
    owner.mutation(api.professionalOwnership.updateProfessionalBasics, {
      professionalId,
      displayName: "Should Not Apply",
      kind: "individual",
      bio: "",
      remoteServices: false,
      publicContactMode: "none",
    }),
  ).rejects.toThrow();
});
