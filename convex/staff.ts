import { mutation, query, type QueryCtx } from "./_generated/server";

/**
 * Staff role lookup and the CMS auth boundary.
 *
 * Better Auth owns identity/session; this file owns *authorization* —
 * whether a signed-in identity may use the CMS at all, and as what role.
 * The two are deliberately separate tables (DATABASE.md section 2,
 * ARCHITECTURE.md section 6: "role grants stored separately from Better
 * Auth identity"), so a Better Auth account by itself grants nothing: it
 * still needs an `active` `staffMemberships` row.
 *
 * `identity.tokenIdentifier`, not `identity.subject` — the Convex
 * guidelines' Authentication section is explicit that `tokenIdentifier` is
 * the guaranteed canonical stable identity key for auth-linked lookups.
 */

async function lookupStaffMembership(ctx: QueryCtx, tokenIdentifier: string) {
  return ctx.db
    .query("staffMemberships")
    .withIndex("by_auth_subject", (q) => q.eq("authSubject", tokenIdentifier))
    .unique();
}

/**
 * What the signed-in caller may do in the CMS, or `null` if they may do
 * nothing — anonymous, no Better Auth session, or a Better Auth account
 * with no (or an inactive) `staffMemberships` row. Every admin screen's
 * server-side gate calls this and fails closed on `null` (AGENTS.md
 * section 6: "Fail closed if auth is missing, invalid... or role revoked").
 */
export const currentStaff = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const membership = await lookupStaffMembership(ctx, identity.tokenIdentifier);
    if (!membership || !membership.active) return null;

    return {
      role: membership.role,
      email: typeof identity.email === "string" ? identity.email : null,
    };
  },
});

/**
 * One-time bootstrap: the first person to sign in through Better Auth while
 * `staffMemberships` is empty may claim the initial `cms_admin` row for
 * *their own, server-verified* identity. Self-limiting by construction —
 * once any row exists this always throws — so it is safe to leave mounted
 * permanently rather than deleted after first use: it also doubles as the
 * recovery path if every staff row is ever deactivated by mistake.
 *
 * Deliberately takes no arguments. The identity comes from `ctx.auth`, not
 * a client-supplied subject/email/role (AGENTS.md section 5: "No client
 * privilege from submitted userId, role... or similar").
 */
export const claimFirstStaffAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in with a Better Auth account before claiming the admin role.");
    }

    const existing = await ctx.db.query("staffMemberships").take(1);
    if (existing.length > 0) {
      throw new Error(
        "A staff account already exists. Ask an active cms_admin to add you in staffMemberships.",
      );
    }

    await ctx.db.insert("staffMemberships", {
      authSubject: identity.tokenIdentifier,
      role: "cms_admin",
      active: true,
      updatedAt: Date.now(),
    });

    return { role: "cms_admin" as const };
  },
});

/**
 * For future `cms:*` queries/mutations that read or write real content
 * (DAY6_ADMIN_CMS.md's "Required authorized functions"): throws rather
 * than returning `null`, so a handler that forgets to check the result
 * cannot accidentally proceed unauthorized.
 */
export async function requireStaff(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not signed in.");
  }
  const membership = await lookupStaffMembership(ctx, identity.tokenIdentifier);
  if (!membership || !membership.active) {
    throw new Error("Not an active staff member.");
  }
  return { ...membership, email: typeof identity.email === "string" ? identity.email : null };
}
