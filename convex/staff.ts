import { v } from "convex/values";

import { authComponent, createAuth } from "./auth";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

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
 * The inverse pair that makes "add staff by email" possible: Convex's
 * `tokenIdentifier` (what `authSubject` always stores) is
 * `${issuer}|${subject}`, where the issuer is this deployment's own
 * `CONVEX_SITE_URL` (`@convex-dev/better-auth`'s `getAuthConfigProvider`)
 * and the subject is the Better Auth user's own `id` (the `jwt` plugin's
 * default `sub`, unchanged by this app's `definePayload`). Getting this
 * format wrong means a newly-granted staff member's row exists but never
 * matches their real session — silently, with no error anywhere.
 */
function extractBetterAuthUserId(authSubject: string): string {
  const separatorIndex = authSubject.indexOf("|");
  return separatorIndex === -1 ? authSubject : authSubject.slice(separatorIndex + 1);
}

function buildAuthSubject(betterAuthUserId: string): string {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) {
    throw new Error("CONVEX_SITE_URL is not set on this Convex deployment.");
  }
  return `${siteUrl}|${betterAuthUserId}`;
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

/**
 * The roster `/admin/staff` renders. `cms_admin` only — a `cms_editor`
 * gets the same server-side refusal the mutations below give, not just a
 * hidden nav link (AGENTS.md section 6).
 */
export const listStaff = query({
  args: {},
  handler: async (ctx) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may view the staff roster.");
    }

    const rows = await ctx.db.query("staffMemberships").collect();
    return await Promise.all(
      rows.map(async (row) => {
        const user = await authComponent.getAnyUserById(ctx, extractBetterAuthUserId(row.authSubject));
        return {
          _id: row._id,
          role: row.role,
          active: row.active,
          updatedAt: row.updatedAt,
          email: user?.email ?? null,
          name: user?.name ?? null,
          isSelf: row.authSubject === staff.authSubject,
        };
      }),
    );
  },
});

/**
 * Grants (or reactivates) CMS access for whoever already signed up with
 * `email` — Approach A from the staff-management-ui design: no invite
 * table, no email-sending dependency. Fails with a clear, actionable
 * message when nobody has signed up with that email yet, rather than a
 * raw adapter error or a silent no-op.
 */
export const addStaffByEmail = mutation({
  args: { email: v.string(), role: v.union(v.literal("cms_admin"), v.literal("cms_editor")) },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may add staff.");
    }

    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required.");
    }

    /*
     * `authComponent.adapter(ctx)` is an `AdapterFactory` (a function Better
     * Auth itself invokes with its resolved options), not a ready adapter —
     * confirmed from `@better-auth/core`'s types after `authComponent.adapter(ctx).findOne`
     * failed to typecheck. The actually-resolved `DBAdapter` lives on the
     * Better Auth instance's own `$context` (`AuthContext.adapter`,
     * `@better-auth/core/dist/types/context.d.mts`).
     */
    const authContext = await createAuth(ctx).$context;
    const user = await authContext.adapter.findOne<{ id: string; email: string; name: string }>({
      model: "user",
      where: [{ field: "email", value: email }],
    });
    if (!user) {
      throw new Error(`No account found for ${email}. Ask them to sign up at /sign-in first.`);
    }

    const authSubject = buildAuthSubject(user.id);
    const existing = await ctx.db
      .query("staffMemberships")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role, active: true, updatedAt: Date.now() });
      await ctx.db.insert("auditEvents", {
        actorSubject: staff.authSubject,
        actorRole: staff.role,
        action: "staff.roleChanged",
        resourceType: "staffMemberships",
        resourceId: existing._id,
        metadata: { email, role: args.role },
        createdAt: Date.now(),
      });
      return { staffId: existing._id, created: false as const };
    }

    const staffId = await ctx.db.insert("staffMemberships", {
      authSubject,
      role: args.role,
      active: true,
      invitedBy: staff.authSubject,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "staff.added",
      resourceType: "staffMemberships",
      resourceId: staffId,
      metadata: { email, role: args.role },
      createdAt: Date.now(),
    });
    return { staffId, created: true as const };
  },
});

/**
 * Stops a `cms_admin` from demoting or deactivating the last active admin
 * — the one way this feature could otherwise lock everyone out of
 * `/admin` (`claimFirstStaffAccount`'s self-recovery path only fires when
 * the table is entirely empty, not when it's all editors). Only fires
 * when `target` is *currently* an active admin; demoting/deactivating a
 * `cms_editor` is never blocked by this.
 */
async function assertCanChangeAdminStatus(
  ctx: MutationCtx,
  target: Doc<"staffMemberships">,
): Promise<void> {
  if (target.role !== "cms_admin" || !target.active) return;
  const rows = await ctx.db.query("staffMemberships").collect();
  const otherActiveAdmins = rows.filter(
    (row) => row._id !== target._id && row.role === "cms_admin" && row.active,
  );
  if (otherActiveAdmins.length === 0) {
    throw new Error("Cannot remove the last active CMS admin.");
  }
}

export const changeStaffRole = mutation({
  args: { id: v.id("staffMemberships"), role: v.union(v.literal("cms_admin"), v.literal("cms_editor")) },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may change roles.");
    }
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("Staff record not found.");
    }
    if (target.role === args.role) {
      return { changed: false as const };
    }
    if (args.role === "cms_editor" && target.role === "cms_admin") {
      await assertCanChangeAdminStatus(ctx, target);
    }

    await ctx.db.patch(args.id, { role: args.role, updatedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "staff.roleChanged",
      resourceType: "staffMemberships",
      resourceId: args.id,
      metadata: { from: target.role, to: args.role },
      createdAt: Date.now(),
    });
    return { changed: true as const };
  },
});

export const setStaffActive = mutation({
  args: { id: v.id("staffMemberships"), active: v.boolean() },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may activate or deactivate staff.");
    }
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("Staff record not found.");
    }
    if (target.active === args.active) {
      return { changed: false as const };
    }
    if (!args.active) {
      await assertCanChangeAdminStatus(ctx, target);
    }

    await ctx.db.patch(args.id, { active: args.active, updatedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: args.active ? "staff.activated" : "staff.deactivated",
      resourceType: "staffMemberships",
      resourceId: args.id,
      metadata: {},
      createdAt: Date.now(),
    });
    return { changed: true as const };
  },
});
