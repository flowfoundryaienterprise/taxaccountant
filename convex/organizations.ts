import { v } from "convex/values";

import { authComponent, createAuth } from "./auth";
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
  if (!user || user.accountStatus !== "active") {
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

/**
 * The full member roster for one organization — the `organizationMembers`
 * counterpart to `staff.ts`'s `listStaff`, including the same
 * authSubject→Better-Auth-user lookup for `email`. Unlike
 * `currentOrganizations` (the caller's own org list, scoped implicitly to
 * `userId`), this takes a client-supplied `organizationId`, so it must be
 * `requireOrgMember`-gated rather than trusting the argument: a signed-in
 * caller who isn't an active member of `organizationId` gets the same "Not
 * an active member of this organization" refusal as every other
 * org-scoped query/mutation, never another org's roster just by supplying
 * its id (AGENTS.md section 5).
 */
export const listOrgMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.organizationId);

    const rows = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return await Promise.all(
      rows.map(async (row) => {
        const member = await ctx.db.get(row.userId);
        const authUser = member
          ? await authComponent.getAnyUserById(ctx, extractBetterAuthUserId(member.authSubject))
          : null;
        return { ...row, email: authUser?.email ?? null };
      }),
    );
  },
});

/**
 * Duplicated from `convex/staff.ts:44-49` rather than imported — that file's
 * own comment explains why: Convex's `tokenIdentifier` is always
 * `${issuer}|${subject}`, where this deployment's `CONVEX_SITE_URL` is the
 * issuer and a Better Auth user's own `id` (the `jwt` plugin's default
 * `sub`) is the subject. Importing it would create a two-way dependency
 * between `staff.ts` and `organizations.ts` for a trivial string template;
 * this task's Files block only touches `convex/organizations.ts`.
 */
function buildAuthSubject(betterAuthUserId: string): string {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) {
    throw new Error("CONVEX_SITE_URL is not set on this Convex deployment.");
  }
  return `${siteUrl}|${betterAuthUserId}`;
}

/**
 * The inverse of `buildAuthSubject` — duplicated from `staff.ts:39-42` for
 * the same reason as `buildAuthSubject` above: this task's Files block only
 * touches `convex/organizations.ts`.
 */
function extractBetterAuthUserId(authSubject: string): string {
  const separatorIndex = authSubject.indexOf("|");
  return separatorIndex === -1 ? authSubject : authSubject.slice(separatorIndex + 1);
}

async function lookupMembershipByUser(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  userId: Id<"appUsers">,
) {
  return ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) => q.eq("organizationId", organizationId).eq("userId", userId))
    .unique();
}

/**
 * Grants (or re-sends, for a never-accepted invite) membership for whoever
 * already has a Better Auth account at `email` — the `organizationMembers`
 * counterpart to `staff.ts`'s `addStaffByEmail`, including its exact
 * adapter-lookup shape and not-found message. Unlike `addStaffByEmail`
 * (which only ever points at an existing `staffMemberships` row because
 * every staff candidate already called `ensureAppUser` once to reach the
 * CMS), an invitee here may have a Better Auth account with no `appUsers`
 * row yet — nothing requires signing up through this app's own account flow
 * before someone else can invite you — so this mutation provisions that row
 * itself, inline, the same shape `ensureAppUser` would have produced.
 *
 * Re-inviting an already-`active` member is a deliberate no-op (same
 * reasoning as `addStaffByEmail`'s guard against an accidental demotion):
 * the caller gets back the existing membership unchanged rather than a
 * silently duplicated row or a role change nobody asked for by re-using the
 * invite form.
 */
export const inviteMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const { user: actor, membership: actorMembership } = await requireOrgRole(
      ctx,
      args.organizationId,
      ["owner", "admin"],
    );

    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required.");
    }

    // Same adapter-lookup shape as `addStaffByEmail` (convex/staff.ts:193-200):
    // `authComponent.adapter(ctx)` is an `AdapterFactory`, not a resolved
    // adapter; the actually-resolved `DBAdapter` lives on `createAuth(ctx).$context.adapter`.
    const authContext = await createAuth(ctx).$context;
    const authUser = await authContext.adapter.findOne<{ id: string; email: string; name: string }>({
      model: "user",
      where: [{ field: "email", value: email }],
    });
    if (!authUser) {
      throw new Error(`No account found for ${email}. Ask them to sign up at /sign-in first.`);
    }

    const authSubject = buildAuthSubject(authUser.id);
    let invitedUser = await lookupAppUser(ctx, authSubject);
    if (!invitedUser) {
      const invitedUserId = await ctx.db.insert("appUsers", {
        authSubject,
        accountStatus: "active",
        createdAt: Date.now(),
      });
      invitedUser = await ctx.db.get(invitedUserId);
      if (!invitedUser) {
        throw new Error("Failed to provision an account for the invited user.");
      }
    }

    const existingMembership = await lookupMembershipByUser(
      ctx,
      args.organizationId,
      invitedUser._id,
    );

    if (existingMembership && existingMembership.status === "active") {
      return { membershipId: existingMembership._id };
    }

    const now = Date.now();
    let membershipId: Id<"organizationMembers">;
    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, { role: args.role, status: "invited" });
      membershipId = existingMembership._id;
    } else {
      membershipId = await ctx.db.insert("organizationMembers", {
        organizationId: args.organizationId,
        userId: invitedUser._id,
        role: args.role,
        status: "invited",
        createdAt: now,
      });
    }

    await ctx.db.insert("auditEvents", {
      actorSubject: actor.authSubject,
      actorRole: actorMembership.role,
      action: "organization.memberInvited",
      resourceType: "organizationMembers",
      resourceId: membershipId,
      metadata: { email, role: args.role },
      createdAt: now,
    });

    return { membershipId };
  },
});

/** Lets the caller accept their own pending invite to `organizationId`. */
export const acceptInvite = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not signed in.");
    }
    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user) {
      throw new Error("No pending invite found for this organization.");
    }
    const membership = await lookupMembershipByUser(ctx, args.organizationId, user._id);
    if (!membership || membership.status !== "invited") {
      throw new Error("No pending invite found for this organization.");
    }

    await ctx.db.patch(membership._id, { status: "active" });
    return {};
  },
});

/** Lets the caller decline their own pending invite to `organizationId`. */
export const declineInvite = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not signed in.");
    }
    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user) {
      throw new Error("No pending invite found for this organization.");
    }
    const membership = await lookupMembershipByUser(ctx, args.organizationId, user._id);
    if (!membership || membership.status !== "invited") {
      throw new Error("No pending invite found for this organization.");
    }

    await ctx.db.delete(membership._id);
    return {};
  },
});

/**
 * Removes a member — owner/admin only, and refuses to remove the last
 * active `owner` (the one way this could otherwise lock everyone out of the
 * organization, same reasoning as `staff.ts`'s `assertCanChangeAdminStatus`
 * guard against removing the last active CMS admin).
 */
export const removeMember = mutation({
  args: { membershipId: v.id("organizationMembers") },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.membershipId);
    if (!target) {
      throw new Error("Membership not found.");
    }

    const { user: actor, membership: actorMembership } = await requireOrgRole(
      ctx,
      target.organizationId,
      ["owner", "admin"],
    );

    if (target.role === "owner" && target.status === "active") {
      const orgMembers = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org", (q) => q.eq("organizationId", target.organizationId))
        .collect();
      const otherActiveOwners = orgMembers.filter(
        (member) => member._id !== target._id && member.role === "owner" && member.status === "active",
      );
      if (otherActiveOwners.length === 0) {
        throw new Error("Cannot remove the last owner of this organization.");
      }
    }

    await ctx.db.patch(target._id, { status: "removed" });
    await ctx.db.insert("auditEvents", {
      actorSubject: actor.authSubject,
      actorRole: actorMembership.role,
      action: "organization.memberRemoved",
      resourceType: "organizationMembers",
      resourceId: target._id,
      metadata: {},
      createdAt: Date.now(),
    });

    return {};
  },
});
