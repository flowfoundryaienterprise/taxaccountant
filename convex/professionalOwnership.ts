import { v } from "convex/values";
import schema from "./schema";
import { onboardingDraftValidator } from "./profileFields";
import { ownedProfessionalProfiles, requireActiveUser } from "./users";
import { api, internal } from "./_generated/api";

import { requireOrgRole } from "./organizations";
import { action, internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Professional-listing ownership: the create-new and claim-existing entry
 * points a `professional_firm` organization uses to get write access to a
 * `professionals` row, plus the shared edit-access gate every later
 * professional-editing mutation (Task 6's wizard steps, Task 9's profile
 * edits) is built on top of (Phase 2, P2-W2, task-5-brief.md).
 *
 * Both entry points share the same role+kind guard: only an `owner`/`admin`
 * of a `professional_firm` organization may create a draft or request a
 * claim. A `customer_business` organization has no business owning a
 * professional listing, and a `member`/`viewer` is not trusted to change who
 * owns one — editing an *already-owned* listing is a separate, looser gate
 * (`requireProfessionalEditAccess`, `owner`/`admin`/`member`).
 */

async function findOwnershipRows(
  ctx: QueryCtx,
  professionalId: Id<"professionals">,
): Promise<Array<Doc<"professionalOwnership">>> {
  // `.collect()`, not `.take(100)` — this backs `requireProfessionalEditAccess`'s
  // search for the single `approved` row. A listing that has accumulated
  // more than 100 ownership rows over time (repeated claims/rejections) would
  // silently lose access for its real owner the moment the approved row
  // falls past position 100 in `.take()`'s cursor order.
  return ctx.db
    .query("professionalOwnership")
    .withIndex("by_professional", (q) => q.eq("professionalId", professionalId))
    .collect();
}

/**
 * The ownership auth gate every professional-editing mutation/query must
 * call before touching a `professionals` row. Fails closed, same reasoning
 * as `requireOrgMember`/`requireOrgRole`: an *approved* ownership row must
 * exist for this professional, and the caller must be an `owner`, `admin`,
 * or `member` of that specific owning organization — a `pending` claim
 * grants no edit access (the whole point of the two-step claim flow), and a
 * `viewer` cannot edit even an org's own listing.
 */
export async function requireProfessionalEditAccess(
  ctx: QueryCtx,
  professionalId: Id<"professionals">,
): Promise<{
  user: Doc<"appUsers">;
  membership: Doc<"organizationMembers">;
  organization: Doc<"organizations">;
  ownership: Doc<"professionalOwnership">;
}> {
  const rows = await findOwnershipRows(ctx, professionalId);
  const ownership = rows.find((row) => row.status === "approved");
  if (!ownership) {
    throw new Error("Your organization does not own this listing.");
  }

  const { user, membership, organization } = await requireOrgRole(ctx, ownership.organizationId, [
    "owner",
    "admin",
    "member",
  ]);

  return { user, membership, organization, ownership };
}

/**
 * Loads the `professionals` row a wizard-step mutation is about to edit and
 * enforces the draft-only guard every one of Task 6's seven mutations
 * shares: once a listing has left `"draft"` (into `review`, `published`,
 * `suspended`, or `archived`) it is no longer the onboarding wizard's to
 * edit — a later review/profile-edit flow (Task 9+) owns it instead.
 */
async function requireDraftProfessional(
  ctx: QueryCtx,
  professionalId: Id<"professionals">,
): Promise<Doc<"professionals">> {
  const professional = await ctx.db.get(professionalId);
  if (!professional) {
    throw new Error("Professional not found.");
  }
  if (professional.publicationStatus !== "draft") {
    throw new Error("Cannot edit a listing that is not in draft.");
  }
  return professional;
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "professional";
}

/**
 * Generates the server-side slug for a new `professionals` row. Never
 * trusted from the client — the slug is derived entirely from
 * `displayName`, the same way every other slugged table in this schema
 * (`serviceCategories`, `contentPages`) is seeded, not supplied by a caller.
 * Collisions append `-2`, `-3`, ... against the `by_slug` index until a free
 * slug is found.
 */
async function generateUniqueProfessionalSlug(
  ctx: MutationCtx,
  displayName: string,
): Promise<string> {
  const base = slugify(displayName);
  let candidate = base;
  let suffix = 2;
  while (
    await ctx.db
      .query("professionals")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique()
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Creates a brand-new `professionals` row owned outright by the caller's
 * organization — the "I'm a firm with no listing yet" entry point. Inserts
 * the matching `professionalOwnership` row as `approved` directly (not
 * `pending`): there is no existing owner to contest a listing that didn't
 * exist a moment ago, so there is nothing to adjudicate.
 */
export const createProfessionalDraft = mutation({
  args: {
    organizationId: v.id("organizations"),
    displayName: v.string(),
    kind: v.union(v.literal("individual"), v.literal("firm")),
  },
  handler: async (ctx, args) => {
    const { user, membership, organization } = await requireOrgRole(ctx, args.organizationId, [
      "owner",
      "admin",
    ]);
    if (organization.kind !== "professional_firm") {
      throw new Error("Only a professional firm organization can create a professional listing.");
    }

    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new Error("Display name is required.");
    }

    const slug = await generateUniqueProfessionalSlug(ctx, displayName);
    const now = Date.now();

    const professionalId = await ctx.db.insert("professionals", {
      slug,
      displayName,
      kind: args.kind,
      bio: "",
      approvedProfile: false,
      verificationStatus: "not_reviewed",
      publicationStatus: "draft",
      remoteServices: false,
      publicContactMode: "contact_form",
      featured: false,
      updatedAt: now,
    });

    const ownershipId = await ctx.db.insert("professionalOwnership", {
      professionalId,
      organizationId: args.organizationId,
      status: "approved",
      requestedByUserId: user._id,
      requestedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: user.authSubject,
      actorRole: membership.role,
      action: "professional.draftCreated",
      resourceType: "professionals",
      resourceId: professionalId,
      metadata: { organizationId: args.organizationId, ownershipId },
      createdAt: now,
    });

    return { professionalId };
  },
});

/**
 * Requests ownership of an *existing* `professionals` row — the "this
 * listing is already in the directory, it's ours" entry point. Only ever
 * creates a `pending` row; nothing here grants edit access
 * (`requireProfessionalEditAccess` only honors `status: "approved"`),
 * because deciding a contested or first-time claim is a staff decision this
 * task doesn't implement (DATABASE.md's professionalOwnership `status`
 * column exists for exactly that later review step).
 */
export const requestProfessionalClaim = mutation({
  args: {
    organizationId: v.id("organizations"),
    professionalId: v.id("professionals"),
  },
  handler: async (ctx, args) => {
    const { user, membership, organization } = await requireOrgRole(ctx, args.organizationId, [
      "owner",
      "admin",
    ]);
    if (organization.kind !== "professional_firm") {
      throw new Error("Only a professional firm organization can claim a professional listing.");
    }

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new Error("Professional not found.");
    }

    const existingRows = await findOwnershipRows(ctx, args.professionalId);
    if (existingRows.some((row) => row.status === "approved")) {
      throw new Error("This listing is already owned by another organization.");
    }
    if (
      existingRows.some(
        (row) => row.status === "pending" && row.organizationId === args.organizationId,
      )
    ) {
      throw new Error("Your organization already has a pending claim for this listing.");
    }

    const now = Date.now();
    const ownershipId = await ctx.db.insert("professionalOwnership", {
      professionalId: args.professionalId,
      organizationId: args.organizationId,
      status: "pending",
      requestedByUserId: user._id,
      requestedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: user.authSubject,
      actorRole: membership.role,
      action: "professional.claimRequested",
      resourceType: "professionalOwnership",
      resourceId: ownershipId,
      metadata: { organizationId: args.organizationId, professionalId: args.professionalId },
      createdAt: now,
    });

    return { ownershipId };
  },
});

/**
 * Onboarding wizard step mutations (Phase 2, P2-W2, task-6-brief.md).
 *
 * Every mutation below is gated by the same two checks, in this order:
 * `requireProfessionalEditAccess` (does the caller's org own this listing,
 * with a role that is not `viewer`?) then `requireDraftProfessional` (is the
 * listing still editable — i.e. still `"draft"`?). Together they mean the
 * wizard can only ever move a listing *out of* `"draft"`
 * (`submitForReview`'s own patch), never edit it once it has left.
 */

export const updateProfessionalBasics = mutation({
  args: {
    professionalId: v.id("professionals"),
    displayName: v.string(),
    kind: v.union(v.literal("individual"), v.literal("firm")),
    firmName: v.optional(v.string()),
    bio: v.string(),
    remoteServices: v.boolean(),
    inPersonServices: v.optional(v.boolean()),
    publicContactMode: v.union(
      v.literal("contact_form"),
      v.literal("external"),
      v.literal("none"),
    ),
  },
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    await requireDraftProfessional(ctx, args.professionalId);

    await ctx.db.patch(args.professionalId, {
      displayName: args.displayName,
      kind: args.kind,
      firmName: args.firmName,
      bio: args.bio,
      remoteServices: args.remoteServices,
      inPersonServices: args.inPersonServices,
      publicContactMode: args.publicContactMode,
      updatedAt: Date.now(),
    });

    return {};
  },
});

export const setProfessionalServices = mutation({
  args: {
    professionalId: v.id("professionals"),
    services: v.array(
      v.object({
        serviceId: v.id("serviceCategories"),
        taxJurisdictionId: v.id("taxJurisdictions"),
        remote: v.boolean(),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    await requireDraftProfessional(ctx, args.professionalId);

    const existing = await ctx.db
      .query("professionalServices")
      .withIndex("by_professional", (q) => q.eq("professionalId", args.professionalId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const service of args.services) {
      await ctx.db.insert("professionalServices", {
        professionalId: args.professionalId,
        serviceId: service.serviceId,
        taxJurisdictionId: service.taxJurisdictionId,
        enabled: true,
        description: service.description,
        remote: service.remote,
      });
    }

    return {};
  },
});

export const setProfessionalLocations = mutation({
  args: {
    professionalId: v.id("professionals"),
    locations: v.array(
      v.object({
        countryId: v.id("countries"),
        city: v.string(),
        region: v.optional(v.string()),
        publicLocationText: v.optional(v.string()),
        isPrimary: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    await requireDraftProfessional(ctx, args.professionalId);

    const existing = await ctx.db
      .query("professionalLocations")
      .withIndex("by_professional", (q) => q.eq("professionalId", args.professionalId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const location of args.locations) {
      await ctx.db.insert("professionalLocations", {
        professionalId: args.professionalId,
        countryId: location.countryId,
        city: location.city,
        region: location.region,
        publicLocationText: location.publicLocationText,
        isPrimary: location.isPrimary,
      });
    }

    return {};
  },
});

export const setProfessionalLanguages = mutation({
  args: {
    professionalId: v.id("professionals"),
    languageIds: v.array(v.id("languages")),
  },
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    await requireDraftProfessional(ctx, args.professionalId);

    const existing = await ctx.db
      .query("professionalLanguages")
      .withIndex("by_professional", (q) => q.eq("professionalId", args.professionalId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    for (const languageId of args.languageIds) {
      await ctx.db.insert("professionalLanguages", {
        professionalId: args.professionalId,
        languageId,
      });
    }

    return {};
  },
});

/**
 * Adds one public-facing credential claim. Always starts `unverified` —
 * `publicDisplayStatus` only ever becomes `verified`/`expired` through a
 * staff review action (outside this task's scope), never by the owning
 * org's own say-so.
 */
export const addPublicCredential = mutation({
  args: {
    professionalId: v.id("professionals"),
    designation: v.string(),
    issuer: v.optional(v.string()),
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
  },
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    await requireDraftProfessional(ctx, args.professionalId);

    const designation = args.designation.trim();
    if (!designation) {
      throw new Error("Credential designation is required.");
    }

    const credentialId = await ctx.db.insert("professionalPublicCredentials", {
      professionalId: args.professionalId,
      designation,
      issuer: args.issuer,
      jurisdictionId: args.jurisdictionId,
      publicDisplayStatus: "unverified",
    });

    return { credentialId };
  },
});

/**
 * Removes a credential claim. Access is still gated by the credential's
 * *professional*, not a bare id check — the credential doc is loaded first
 * purely to discover which `professionalId` it belongs to.
 */
export const removePublicCredential = mutation({
  args: {
    credentialId: v.id("professionalPublicCredentials"),
  },
  handler: async (ctx, args) => {
    const credential = await ctx.db.get(args.credentialId);
    if (!credential) {
      throw new Error("Credential not found.");
    }

    await requireProfessionalEditAccess(ctx, credential.professionalId);
    await requireDraftProfessional(ctx, credential.professionalId);

    await ctx.db.delete(args.credentialId);

    return {};
  },
});

/**
 * Moves a `"draft"` listing into `"review"` — the one wizard-step mutation
 * allowed to change `publicationStatus` at all (every other mutation above
 * only ever touches it via the shared draft-only guard, never writes it).
 * Required-fields checks use `.first()` against each join table's
 * `by_professional` index rather than `.collect()`: existence is all that
 * matters here, so there is no reason to read every row just to find out
 * whether at least one exists.
 */
export const submitForReview = mutation({
  args: {
    professionalId: v.id("professionals"),
  },
  handler: async (ctx, args) => {
    const { user, membership } = await requireProfessionalEditAccess(ctx, args.professionalId);
    const professional = await requireDraftProfessional(ctx, args.professionalId);

    if (professional.onboardingDraft) throw new Error("Submit this profile through the onboarding review screen.");
    if (!professional.displayName.trim()) {
      throw new Error("Display name is required before submitting for review.");
    }

    const hasService = await ctx.db
      .query("professionalServices")
      .withIndex("by_professional", (q) => q.eq("professionalId", args.professionalId))
      .first();
    const hasLocation = await ctx.db
      .query("professionalLocations")
      .withIndex("by_professional", (q) => q.eq("professionalId", args.professionalId))
      .first();
    if (!hasService && !hasLocation) {
      // A purely remote professional may have services but no physical
      // `professionalLocations` row (and vice versa for an in-person-only
      // professional with no services configured yet is still incomplete
      // for other reasons, but that's not this guard's job) — either one
      // is sufficient; only "neither" blocks submission.
      throw new Error(
        "At least one service or location is required before submitting for review.",
      );
    }

    const now = Date.now();
    await ctx.db.patch(args.professionalId, {
      publicationStatus: "review",
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: user.authSubject,
      actorRole: membership.role,
      action: "professional.submittedForReview",
      resourceType: "professionals",
      resourceId: args.professionalId,
      metadata: { organizationId: membership.organizationId },
      createdAt: now,
    });

    return {};
  },
});

export const myProfiles = query({
  args: {}, returns: v.array(schema.doc("professionals")),
  handler: async ctx => ownedProfessionalProfiles(ctx),
});
export const getOwnedProfile = query({
  args: { professionalId: v.id("professionals") },
  returns: v.object({profile: schema.doc("professionals"), photoUrl: v.union(v.string(), v.null())}),
  handler: async (ctx, {professionalId}) => {
    await requireProfessionalEditAccess(ctx, professionalId);
    const profile = await ctx.db.get(professionalId);
    if (!profile) throw new Error("Profile not found.");
    return {profile, photoUrl: profile.profilePhotoId ? await ctx.storage.getUrl(profile.profilePhotoId) : null};
  },
});
/** One transaction creates both the firm and its first draft, retry-safe per caller. */
export const beginOnboarding = mutation({
  args: {}, returns: v.id("professionals"),
  handler: async (ctx): Promise<Id<"professionals">> => {
    const user = await requireActiveUser(ctx);
    if (user.role !== "professional") throw new Error("A service provider account is required.");
    const profiles = await ownedProfessionalProfiles(ctx);
    const draft = profiles.find(p => p.publicationStatus === "draft");
    if (draft) return draft._id;
    // Only an actively-submitted profile (review/published) is a reason to
    // stop here — `profiles.length` alone also matches a suspended or
    // archived profile with no draft, which is not "already submitted" and
    // has no dashboard to open; that used to dead-end the caller with a
    // message describing a state they weren't in.
    if (profiles.some(p => p.publicationStatus === "review" || p.publicationStatus === "published")) {
      throw new Error("Your existing profile is already submitted. Open your dashboard.");
    }
    const name = user.displayName?.trim() || "My practice";
    const {organizationId} = await ctx.runMutation(api.organizations.createOrganization, {name, kind: "professional_firm"});
    const result = await ctx.runMutation(api.professionalOwnership.createProfessionalDraft, {organizationId, displayName: name, kind: "individual"});
    return result.professionalId;
  },
});
export const saveOnboardingDraft = mutation({
  args: {professionalId: v.id("professionals"), draft: onboardingDraftValidator}, returns: v.null(),
  handler: async (ctx, {professionalId, draft}) => {
    await requireProfessionalEditAccess(ctx, professionalId);
    await requireDraftProfessional(ctx, professionalId);
    if (!Number.isInteger(draft.step) || draft.step < 0 || draft.step > 8) throw new Error("Invalid onboarding step.");
    if (draft.displayName.length > 120 || draft.businessName.length > 160 || draft.bio.length > 4000 || draft.city.length > 100 || draft.region.length > 100) throw new Error("A profile field is too long.");
    if (draft.serviceIds.length > 20 || draft.jurisdictionIds.length > 30 || draft.credentials.length > 10 || draft.credentials.some(c => c.designation.length > 100 || c.issuer.length > 160)) throw new Error("Too many selections or a credential is too long.");
    await ctx.db.patch(professionalId, {onboardingDraft: draft, updatedAt: Date.now()});
    return null;
  },
});
export const attachProfilePhoto = internalMutation({
  args: {professionalId: v.id("professionals"), storageId: v.id("_storage")}, returns: v.null(),
  handler: async (ctx, args) => {
    await requireProfessionalEditAccess(ctx, args.professionalId);
    const profile = await requireDraftProfessional(ctx, args.professionalId);
    await ctx.db.patch(args.professionalId, {profilePhotoId: args.storageId, updatedAt: Date.now()});
    if (profile.profilePhotoId && profile.profilePhotoId !== args.storageId) await ctx.storage.delete(profile.profilePhotoId);
    return null;
  },
});
export const uploadProfilePhoto = action({
  args: {professionalId: v.id("professionals"), bytes: v.bytes()}, returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const {profile} = await ctx.runQuery(api.professionalOwnership.getOwnedProfile, {professionalId: args.professionalId});
    if (profile.publicationStatus !== "draft") throw new Error("Only draft profiles can be edited.");
    const bytes = new Uint8Array(args.bytes);
    if (!bytes.length || bytes.length > 750000) throw new Error("Choose a JPG or PNG smaller than 750 KB.");
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!png && !jpeg) throw new Error("Only JPG and PNG photographs are supported.");
    const storageId = await ctx.storage.store(new Blob([args.bytes], {type: png ? "image/png" : "image/jpeg"}));
    try { await ctx.runMutation(internal.professionalOwnership.attachProfilePhoto, {professionalId: args.professionalId, storageId}); }
    catch (error) { await ctx.storage.delete(storageId); throw error; }
    return null;
  },
});
export const submitOnboarding = mutation({
  args: {professionalId: v.id("professionals")}, returns: v.null(),
  handler: async (ctx, {professionalId}) => {
    await requireProfessionalEditAccess(ctx, professionalId);
    const profile = await requireDraftProfessional(ctx, professionalId);
    const draft = profile.onboardingDraft;
    if (!draft || !draft.displayName.trim() || !draft.businessName.trim() || draft.bio.trim().length < 50 || !draft.city.trim() || !draft.countryId || !profile.profilePhotoId || !draft.credentials.some(c => c.designation.trim()) || !draft.serviceIds.length || !draft.jurisdictionIds.length) throw new Error("Complete all profile steps before submitting.");
    const country = await ctx.db.get(draft.countryId);
    if (!country?.onboardingEnabled || country.code !== "US" || country.status !== "published") throw new Error("Onboarding is currently available for USA practices.");
    for (const id of draft.serviceIds) {
      const service = await ctx.db.get(id);
      if (service?.publicationStatus !== "published") throw new Error("Select a published service.");
    }
    for (const id of draft.jurisdictionIds) {
      const jurisdiction = await ctx.db.get(id);
      if (!jurisdiction?.active || jurisdiction.countryId !== draft.countryId) throw new Error("Select an active jurisdiction for your country.");
    }
    await ctx.runMutation(api.professionalOwnership.updateProfessionalBasics, {professionalId, displayName: draft.displayName.trim(), kind: profile.kind, firmName: draft.businessName.trim(), bio: draft.bio.trim(), remoteServices: draft.remote, inPersonServices: !draft.remote, publicContactMode: "contact_form"});
    await ctx.runMutation(api.professionalOwnership.setProfessionalServices, {professionalId, services: [...new Set(draft.serviceIds)].flatMap(serviceId => [...new Set(draft.jurisdictionIds)].map(taxJurisdictionId => ({serviceId, taxJurisdictionId, remote: draft.remote})))});
    await ctx.runMutation(api.professionalOwnership.setProfessionalLocations, {professionalId, locations: [{countryId: draft.countryId, city: draft.city.trim(), region: draft.region.trim(), isPrimary: true}]});
    const oldCredentials = await ctx.db.query("professionalPublicCredentials").withIndex("by_professional", q => q.eq("professionalId", professionalId)).take(100);
    for (const credential of oldCredentials) await ctx.db.delete(credential._id);
    for (const credential of draft.credentials) {
      if (credential.designation.trim()) await ctx.db.insert("professionalPublicCredentials", {professionalId, designation: credential.designation.trim(), issuer: credential.issuer.trim(), publicDisplayStatus: "unverified"});
    }
    const {user, membership} = await requireProfessionalEditAccess(ctx, professionalId);
    await ctx.db.patch(professionalId, {onboardingCompletedAt: Date.now(), publicationStatus: "review", approvedProfile: false, updatedAt: Date.now()});
    await ctx.db.insert("auditEvents", {actorSubject: user.authSubject, actorRole: membership.role, action: "professional.submittedForReview", resourceType: "professionals", resourceId: professionalId, metadata: {}, createdAt: Date.now()});
    return null;
  },
});

/** Editing a published profile first withdraws it; publication always needs a new staff review. */
export const reopenForEditing = mutation({
 args: {professionalId: v.id("professionals")}, returns: v.null(),
 handler: async (ctx, {professionalId}) => {
  const {user,membership} = await requireProfessionalEditAccess(ctx,professionalId);
  const profile=await ctx.db.get(professionalId);
  if(!profile || (profile.publicationStatus!=="published" && profile.publicationStatus!=="review")) throw new Error("This profile cannot be reopened.");
  if(!profile.onboardingDraft) throw new Error("Contact support to migrate this older profile before editing.");
  await ctx.db.patch(professionalId,{publicationStatus:"draft",approvedProfile:false,updatedAt:Date.now()});
  await ctx.db.insert("auditEvents",{actorSubject:user.authSubject,actorRole:membership.role,action:"professional.withdrawnForEditing",resourceType:"professionals",resourceId:professionalId,metadata:{},createdAt:Date.now()});
  return null;
 }
});
