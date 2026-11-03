import { v } from "convex/values";

import { requireOrgRole } from "./organizations";
import { mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
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
