import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

import { mutation, query, type QueryCtx } from "./_generated/server";

/**
 * Public account lookup and bootstrap — the `appUsers` counterpart to
 * `convex/staff.ts` (Phase 2, P2-W1, DATABASE.md section 3).
 *
 * Deliberately the open version of `staff.ts`'s pattern: `claimFirstStaffAccount`
 * is self-limiting to one admin-provisioned row ever; `ensureAppUser` is not
 * limited at all, because a public account is exactly what self-registration
 * through Better Auth is for. What's shared is the principle — identity
 * comes from `ctx.auth`, never a client-supplied subject or status
 * (AGENTS.md section 5).
 */

async function lookupAppUser(ctx: QueryCtx, authSubject: string) {
  return ctx.db
    .query("appUsers")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
    .unique();
}

/** The signed-in caller's own account, or `null` if unauthenticated or not yet provisioned. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user) return null;

    return {
      displayName: user.displayName,
      accountStatus: user.accountStatus,
      role: user.role,
      email: typeof identity.email === "string" ? identity.email : null,
    };
  },
});

/**
 * Creates the caller's `appUsers` row on first sign-in, or returns the
 * existing one — filling in `role` if the row has none yet, but never
 * overwriting a `role` it already has.
 *
 * Two call sites race to create this row for a brand-new sign-up: the
 * role-aware one (`/customer/dashboard` and `/professional/dashboard`
 * call `fetchAuthMutation(ensureAppUser, { role })` during their own SSR —
 * see the comment there) and the generic one (`EnsureAppUser`, a
 * client-side effect mounted for the whole app, which calls this with no
 * `role` at all). Confirmed live: when `EnsureAppUser`'s client round trip
 * won that race, the row existed with `role: undefined` by the time the
 * dashboard's own call ran, and the old "only set role on creation" rule
 * left it that way — an account that had genuinely picked "Service
 * Provider" at sign-up landed back on the customer dashboard on its next
 * sign-in, because nothing had ever recorded which it was. "Fill in only
 * if missing" fixes that regardless of which call wins the race, while
 * still refusing to reassign a role an account already has — visiting
 * `/professional/dashboard` directly can't silently convert an existing
 * customer account, because `existing.role` is already set.
 */
export const ensureAppUser = mutation({
  args: {
    role: v.optional(v.union(v.literal("customer"), v.literal("professional"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in before provisioning an account.");
    }

    const existing = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (existing) {
      if (args.role && !existing.role) {
        await ctx.db.patch(existing._id, { role: args.role });
        return { accountStatus: existing.accountStatus, role: args.role };
      }
      return { accountStatus: existing.accountStatus, role: existing.role };
    }

    await ctx.db.insert("appUsers", {
      authSubject: identity.tokenIdentifier,
      displayName: typeof identity.name === "string" ? identity.name : undefined,
      accountStatus: "active",
      role: args.role,
      createdAt: Date.now(),
    });

    return { accountStatus: "active" as const, role: args.role };
  },
});

/**
 * For future per-user mutations (favorites, saved searches — P2-W4) to
 * require an active public account. Throws rather than returning `null`,
 * same reasoning as `requireStaff`: a handler that forgets to check cannot
 * accidentally proceed unauthorized.
 */
export async function requireActiveUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not signed in.");
  }
  const user = await lookupAppUser(ctx, identity.tokenIdentifier);
  if (!user || user.accountStatus !== "active") {
    throw new Error("No active account.");
  }
  return { ...user, email: typeof identity.email === "string" ? identity.email : null };
}

/** Session-derived route selection. Signup selection can never grant a staff role. */
export const accountDestination = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "/login";
    const staff = await ctx.db.query("staffMemberships").withIndex("by_auth_subject", q => q.eq("authSubject", identity.tokenIdentifier)).unique();
    if (staff?.active) return "/admin/dashboard";
    const user = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (!user || user.accountStatus !== "active") return "/login?reason=inactive";
    if (user.role !== "professional") return "/customer/dashboard";
    const profiles = await ownedProfessionalProfiles(ctx);
    return profiles.some(p => p.publicationStatus === "review" || p.publicationStatus === "published")
      ? "/professional/dashboard" : "/professional/onboarding";
  },
});

/** Editable profiles of active firms belonging to this caller; bounded and identity scoped. */
export async function ownedProfessionalProfiles(ctx: QueryCtx) {
  const user = await requireActiveUser(ctx);
  const memberships = await ctx.db.query("organizationMembers").withIndex("by_user", q => q.eq("userId", user._id)).take(51);
  if (memberships.length > 50) throw new Error("Too many memberships; contact support.");
  const profiles: Doc<"professionals">[] = [];
  for (const member of memberships) {
    if (member.status !== "active" || member.role === "viewer") continue;
    const org = await ctx.db.get(member.organizationId);
    if (!org || org.status !== "active" || org.kind !== "professional_firm") continue;
    const ownerships = await ctx.db.query("professionalOwnership").withIndex("by_org", q => q.eq("organizationId", org._id)).take(51);
    if (ownerships.length > 50) throw new Error("Too many profiles; contact support.");
    for (const ownership of ownerships) {
      if (ownership.status !== "approved") continue;
      const profile = await ctx.db.get(ownership.professionalId);
      if (profile && !profiles.some(p => p._id === profile._id)) profiles.push(profile);
    }
  }
  return profiles;
}
