import { v } from "convex/values";

import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Organization creation and membership authorization — the `organizations`/
 * `organizationMembers` counterpart to `convex/staff.ts`'s staff-role gate
 * (Phase 2, P2-W2, DATABASE.md section 3). `requireOrgMember`/`requireOrgRole`
 * are the auth boundary Tasks 4, 5, and 7 build their organization-scoped
 * queries/mutations on top of.
 *
 * Duplicated here rather than imported from `convex/users.ts`: this task's
 * Files block only touches `convex/organizations.ts`.
 */

async function lookupAppUser(ctx: QueryCtx, authSubject: string) {
  return ctx.db
    .query("appUsers")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
    .unique();
}

async function lookupActiveMembership(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  userId: Id<"appUsers">,
) {
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) => q.eq("organizationId", organizationId).eq("userId", userId))
    .unique();
  return membership && membership.status === "active" ? membership : null;
}

/**
 * Fails closed: throws rather than returning `null`, same reasoning as
 * `requireStaff`/`requireActiveUser` — a handler that forgets to check the
 * result cannot accidentally proceed unauthorized. Checks membership
 * *before* org status, so a removed/invited member gets the same "not an
 * active member" error whether or not the org happens to be suspended.
 */
export async function requireOrgMember(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
): Promise<{
  user: Doc<"appUsers">;
  membership: Doc<"organizationMembers">;
  organization: Doc<"organizations">;
}> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not signed in.");
  }

  const user = await lookupAppUser(ctx, identity.tokenIdentifier);
  if (!user) {
    throw new Error("Not an active member of this organization.");
  }

  const membership = await lookupActiveMembership(ctx, organizationId, user._id);
  if (!membership) {
    throw new Error("Not an active member of this organization.");
  }

  const organization = await ctx.db.get(organizationId);
  if (!organization) {
    throw new Error("Not an active member of this organization.");
  }
  if (organization.status !== "active") {
    throw new Error("This organization is suspended.");
  }

  return { user, membership, organization };
}

/** As `requireOrgMember`, additionally requiring the caller's role be one of `roles`. */
export async function requireOrgRole(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  roles: Array<"owner" | "admin" | "member" | "viewer">,
): Promise<ReturnType<typeof requireOrgMember>> {
  const result = await requireOrgMember(ctx, organizationId);
  if (!roles.includes(result.membership.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return result;
}

/**
 * Creates a new organization and makes the caller its `owner` — the only
 * way an `organizations` row comes into existence. Identity comes from
 * `ctx.auth`, never a client-supplied owner id (AGENTS.md section 5).
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal("customer_business"), v.literal("professional_firm")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not signed in.");
    }

    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user || user.accountStatus !== "active") {
      throw new Error("No active account.");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Organization name is required.");
    }

    const now = Date.now();
    const organizationId = await ctx.db.insert("organizations", {
      name,
      kind: args.kind,
      ownerUserId: user._id,
      status: "active",
      createdAt: now,
    });

    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: user._id,
      role: "owner",
      status: "active",
      createdAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: identity.tokenIdentifier,
      actorRole: "owner",
      action: "organization.created",
      resourceType: "organizations",
      resourceId: organizationId,
      metadata: { name, kind: args.kind },
      createdAt: now,
    });

    return { organizationId };
  },
});

/** Every organization the caller has an active membership in, with their own role. */
export const currentOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user) return [];

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const active = memberships.filter((membership) => membership.status === "active");

    const rows = await Promise.all(
      active.map(async (membership) => {
        const organization = await ctx.db.get(membership.organizationId);
        if (!organization) return null;
        return {
          organizationId: membership.organizationId,
          membershipId: membership._id,
          name: organization.name,
          kind: organization.kind,
          role: membership.role,
        };
      }),
    );

    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});
