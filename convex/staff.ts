import { v } from "convex/values";

import { authComponent, createAuth } from "./auth";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

export const applicationDetails = query({
  args: {professionalId:v.id("professionals")},
  returns:v.object({services:v.array(v.string()),credentials:v.array(v.string()),photoUrl:v.union(v.string(),v.null())}),
  handler:async(ctx,{professionalId})=>{
    const staff=await requireStaff(ctx);
    if(staff.role!=="cms_admin") throw new Error("Administrator access is required.");
    const profile=await ctx.db.get(professionalId);
    if(!profile) throw new Error("Profile not found.");
    const offerings=await ctx.db.query("professionalServices").withIndex("by_professional",q=>q.eq("professionalId",professionalId)).take(601);
    const services=await Promise.all(offerings.filter(o=>o.enabled).map(async o=>{
      const service=await ctx.db.get(o.serviceId);const jurisdiction=await ctx.db.get(o.taxJurisdictionId);
      return `${service?.name??"Unavailable service"} · ${jurisdiction?.label??"Unavailable jurisdiction"}`;
    }));
    const credentials=await ctx.db.query("professionalPublicCredentials").withIndex("by_professional",q=>q.eq("professionalId",professionalId)).take(100);
    return {services,credentials:credentials.map(c=>`${c.designation} · ${c.issuer??"Issuer not provided"} · ${c.publicDisplayStatus}`),photoUrl:profile.profilePhotoId?await ctx.storage.getUrl(profile.profilePhotoId):null};
  }
});

export const applicationQueue = query({
  args: {status: v.union(v.literal("review"),v.literal("published"),v.literal("draft"))},
  returns: v.array(schema.doc("professionals")),
  handler: async (ctx,{status}) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") throw new Error("Administrator access is required.");
    return ctx.db.query("professionals").withIndex("by_publication_status", q=>q.eq("publicationStatus",status)).order("desc").take(100);
  },
});

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

    const user = await authComponent.getAuthUser(ctx);

    return {
      role: membership.role,
      email: typeof identity.email === "string" ? identity.email : null,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
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
/**
 * Whether `staffMemberships` has any row yet — i.e. whether
 * `claimFirstStaffAccount` below would still succeed. No identity check
 * and no PII in the response, just a boolean: safe to call signed out, so
 * the public sign-up form (`AccountAuthForm`) can show its "CMS Admin"
 * toggle only while claiming it would actually work, rather than letting
 * someone pick it and then fail after submitting.
 */
export const staffBootstrapClaimed = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("staffMemberships").take(1);
    return existing.length > 0;
  },
});

export const claimFirstStaffAccount = internalMutation({
  args: {},
  returns: v.object({ role: v.literal("cms_admin") }),
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
      /*
       * Re-adding an existing row can both change its role and reactivate
       * it — guard an actual demotion exactly like `changeStaffRole` does
       * (only when it is one: re-adding the same role, or reactivating
       * without changing role, must never throw just because the target
       * happens to be the last active admin). Without this, the form's
       * default role ("Editor") meant re-adding an existing admin's own
       * email silently demoted them, bypassing the last-admin guard
       * entirely (caught in the final whole-branch review, not
       * live-verified originally — the plan's Review Focus item 3 path
       * had never actually run).
       */
      if (args.role === "cms_editor" && existing.role === "cms_admin") {
        await assertCanChangeAdminStatus(ctx, existing);
      }

      const roleChanged = existing.role !== args.role;
      const wasInactive = !existing.active;
      await ctx.db.patch(existing._id, { role: args.role, active: true, updatedAt: Date.now() });

      if (roleChanged) {
        await ctx.db.insert("auditEvents", {
          actorSubject: staff.authSubject,
          actorRole: staff.role,
          action: "staff.roleChanged",
          resourceType: "staffMemberships",
          resourceId: existing._id,
          metadata: { email, from: existing.role, to: args.role },
          createdAt: Date.now(),
        });
      }
      if (wasInactive) {
        await ctx.db.insert("auditEvents", {
          actorSubject: staff.authSubject,
          actorRole: staff.role,
          action: "staff.activated",
          resourceType: "staffMemberships",
          resourceId: existing._id,
          metadata: { email },
          createdAt: Date.now(),
        });
      }
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

/**
 * Lets a `cms_admin` rescue another staff member who lost access to both
 * their email and their backup codes — not a self-service path:
 * `disableTwoFactor` (requires the caller's own password) already covers
 * that. Reaches past the plugin's own session-scoped API, straight
 * through the Better Auth adapter, the same way `addStaffByEmail`
 * resolves identities (docs/superpowers/specs/2026-11-03-staff-mfa-design.md).
 */
export const adminResetTwoFactor = mutation({
  args: { id: v.id("staffMemberships") },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may reset another staff member's MFA.");
    }

    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new Error("Staff record not found.");
    }
    if (target.authSubject === staff.authSubject) {
      throw new Error(
        "Cannot reset your own MFA this way — use the disable option on /admin/security instead.",
      );
    }

    const targetUserId = extractBetterAuthUserId(target.authSubject);
    const authContext = await createAuth(ctx).$context;
    const deletedCount = await authContext.adapter.deleteMany({
      model: "twoFactor",
      where: [{ field: "userId", value: targetUserId }],
    });

    if (deletedCount === 0) {
      return { reset: false as const };
    }

    await authContext.adapter.update({
      model: "user",
      where: [{ field: "id", value: targetUserId }],
      update: { twoFactorEnabled: false },
    });
    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "staff.mfaReset",
      resourceType: "staffMemberships",
      resourceId: args.id,
      metadata: {},
      createdAt: Date.now(),
    });
    return { reset: true as const };
  },
});

/**
 * Staff review — claims and publication (Phase 2, P2-W2, task-7-brief.md).
 *
 * Any active staff member (`cms_admin` or `cms_editor`) may use the five
 * functions below — unlike `addStaffByEmail`/`changeStaffRole`/etc. above,
 * none of them is further restricted to `cms_admin` only, so each calls
 * only `requireStaff(ctx)`, not an added role check.
 */

/**
 * The claims queue `/admin` renders so staff can adjudicate a
 * `professionalOwnership` row `requestProfessionalClaim`
 * (`convex/professionalOwnership.ts`) left `"pending"`. Queries the
 * `by_status` index rather than `.collect()` + filter, and joins in the two
 * display fields (`professionals.displayName`, `organizations.name`) a
 * claims-review UI needs but a bare ownership row doesn't carry.
 */
export const listPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);

    const rows = await ctx.db
      .query("professionalOwnership")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return await Promise.all(
      rows.map(async (row) => {
        const professional = await ctx.db.get(row.professionalId);
        const organization = await ctx.db.get(row.organizationId);
        return {
          ...row,
          professionalDisplayName: professional?.displayName ?? "Unknown professional",
          organizationName: organization?.name ?? "Unknown organization",
        };
      }),
    );
  },
});

/**
 * Adjudicates one pending claim: `"approve"` grants the claiming
 * organization ownership (`status: "approved"`, which is what
 * `requireProfessionalEditAccess` actually honors); `"reject"` revokes it
 * outright (`status: "revoked"`) rather than leaving it `"pending"`
 * forever. Only ever acts on a currently-`"pending"` row — a claim that has
 * already been decided cannot be re-decided through this mutation.
 */
export const decideClaim = mutation({
  args: {
    ownershipId: v.id("professionalOwnership"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);

    const ownership = await ctx.db.get(args.ownershipId);
    if (!ownership) {
      throw new Error("Ownership claim not found.");
    }
    if (ownership.status !== "pending") {
      throw new Error("This claim has already been decided.");
    }

    const newStatus = args.decision === "approve" ? ("approved" as const) : ("revoked" as const);
    const now = Date.now();
    await ctx.db.patch(args.ownershipId, {
      status: newStatus,
      decidedByAuthSubject: staff.authSubject,
      decidedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "professional.claimDecided",
      resourceType: "professionalOwnership",
      resourceId: args.ownershipId,
      metadata: {
        decision: args.decision,
        professionalId: ownership.professionalId,
        organizationId: ownership.organizationId,
      },
      createdAt: now,
    });

    return {};
  },
});

/**
 * The publish-review queue `/admin` renders so staff have something to act
 * on after `submitForReview` (`convex/professionalOwnership.ts`, Task 6)
 * moves a listing to `"review"` — that mutation otherwise has no reachable
 * UI consumer. Queries the existing `professionals.by_publication_status`
 * index rather than `.collect()` + filter.
 */
export const listProfessionalsPendingReview = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);

    return await ctx.db
      .query("professionals")
      .withIndex("by_publication_status", (q) => q.eq("publicationStatus", "review"))
      .collect();
  },
});

/**
 * Publishes a listing that is currently in `"review"` — the only state this
 * may act on, so a listing already `"published"`, or one staff haven't seen
 * yet (`"draft"`), cannot be published out of band. Sets `approvedProfile`
 * alongside `publicationStatus`: publication *is* the profile approval this
 * field represents.
 */
export const publishProfessional = mutation({
  args: { professionalId: v.id("professionals") },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") throw new Error("Only a CMS administrator may review profiles.");

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new Error("Professional not found.");
    }
    if (professional.publicationStatus !== "review") {
      throw new Error("Only a listing in review can be published.");
    }

    const now = Date.now();
    await ctx.db.patch(args.professionalId, {
      publicationStatus: "published",
      approvedProfile: true,
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "professional.published",
      resourceType: "professionals",
      resourceId: args.professionalId,
      metadata: {},
      createdAt: now,
    });

    return {};
  },
});

/**
 * Sends a `"review"` listing back to `"draft"` — deliberately not a new
 * terminal "rejected" state (design doc section 7.4): `"draft"` is the same
 * state `createProfessionalDraft` starts a listing in, so the owning org's
 * draft-only wizard mutations (`requireDraftProfessional`,
 * `convex/professionalOwnership.ts`) immediately accept edits again, letting
 * the org act on `reason` and resubmit via `submitForReview`.
 */
export const rejectProfessional = mutation({
  args: {
    professionalId: v.id("professionals"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") throw new Error("Only a CMS administrator may review profiles.");
    if (!args.reason.trim() || args.reason.length > 2000) throw new Error("Give a reason of 1–2,000 characters.");

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new Error("Professional not found.");
    }
    if (professional.publicationStatus !== "review") {
      throw new Error("Only a listing in review can be rejected.");
    }

    const now = Date.now();
    await ctx.db.patch(args.professionalId, {
      publicationStatus: "draft",
      approvedProfile: false,
      reviewFeedback: args.reason.trim(),
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "professional.rejected",
      resourceType: "professionals",
      resourceId: args.professionalId,
      metadata: { reason: args.reason },
      createdAt: now,
    });

    return {};
  },
});
