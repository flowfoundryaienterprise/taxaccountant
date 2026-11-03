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
): Promise<{ organization: Doc<"organizations">; ownership: Doc<"professionalOwnership"> }> {
  const rows = await findOwnershipRows(ctx, professionalId);
  const ownership = rows.find((row) => row.status === "approved");
  if (!ownership) {
    throw new Error("Your organization does not own this listing.");
  }

  const { organization } = await requireOrgRole(ctx, ownership.organizationId, [
    "owner",
    "admin",
    "member",
  ]);

  return { organization, ownership };
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
