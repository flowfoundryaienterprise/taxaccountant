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
      email: typeof identity.email === "string" ? identity.email : null,
    };
  },
});

/**
 * Creates the caller's `appUsers` row on first sign-in, or returns the
 * existing one unchanged. Called right after a successful Better Auth
 * sign-up/sign-in (`src/components/shared/account-auth-form.tsx`) — a
 * Better Auth identity by itself has no `appUsers` row, the same way it has
 * no `staffMemberships` row, until something creates one.
 */
export const ensureAppUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in before provisioning an account.");
    }

    const existing = await lookupAppUser(ctx, identity.tokenIdentifier);
    if (existing) {
      return { accountStatus: existing.accountStatus };
    }

    await ctx.db.insert("appUsers", {
      authSubject: identity.tokenIdentifier,
      displayName: typeof identity.name === "string" ? identity.name : undefined,
      accountStatus: "active",
      createdAt: Date.now(),
    });

    return { accountStatus: "active" as const };
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
