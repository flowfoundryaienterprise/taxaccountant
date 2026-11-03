# Staff management UI — design (short)

**Size:** small change. **Status:** approved by owner 2026-11-03, ready to build.

## Intent / why

`IMPLEMENTATION_PLAN.md`'s P2-W1 goal includes "staff permissions expanded."
Today a `staffMemberships` row (`cms_admin` | `cms_editor`) can only be
created by `claimFirstStaffAccount` (one-time bootstrap) or by hand-editing
the Convex table — `staff-login-form.tsx` literally tells people to "Ask an
active cms_admin to add you in staffMemberships." This replaces that
hand-edit with a real CMS screen.

## Goals

- A `cms_admin` can grant staff access to someone who already has a Better
  Auth account (public sign-up or prior staff), change their role, and
  deactivate them — all from `/admin/staff`.
- Every action audited (`auditEvents`), matching `content.ts`'s existing
  convention.
- A `cms_admin` can never lock every admin out: block deactivating or
  demoting the last active `cms_admin`.

## Non-goals / anti-goals

- No invite-by-email-before-signup flow (Approach B, declined — see below).
  Granting access still requires the target to have signed up first.
- No new roles beyond `cms_admin` / `cms_editor` — nothing in the CMS yet
  differentiates further (confirmed in conversation: most `cms:*` write
  mutations besides Pages/Articles/Messages don't exist yet).
- Not touching `appUsers`/customer accounts, organizations, or anything
  P2-W2-scoped.

## Constraints

- `staffMemberships.authSubject` must exactly match the `tokenIdentifier`
  Convex produces for that identity at sign-in (`${issuer}|${subject}`,
  per `convex/staff.ts`'s existing lookups) — getting this wrong means a
  newly-added staff member silently never gets in. Verified from source
  (not assumed): the issuer is `process.env.CONVEX_SITE_URL`
  (`@convex-dev/better-auth`'s `getAuthConfigProvider`), and the subject is
  the Better Auth user's own `id` (the `jwt` plugin's default `sub`, not
  overridden by this app's `definePayload`). **Must verify live** — sign up
  a test account, add it as staff, confirm it actually gets `/admin` access
  — before calling this done, same as every other auth change this session.
- Server-side authorization only, mutations included — the UI being
  admin-only is not the security boundary (`AGENTS.md` section 6, the
  pattern every existing `cms:*`/`content:*` mutation already follows).

## Approach (decided in conversation)

**A — add by existing account's email**, not B (email-invite-before-signup).
Reuses `authComponent.adapter(ctx).findOne({ model: "user", where: [{
field: "email", value }] })` to resolve an email to a Better Auth user; no
new table, no new email dependency. If no account exists yet, the mutation
fails with a message telling the admin to have that person sign up first.

## The how (decided)

- `convex/staff.ts` additions:
  - `listStaff` query (`cms_admin` only): every `staffMemberships` row,
    each resolved to its email/name via `authComponent.getAnyUserById`.
  - `addStaffByEmail` mutation (`cms_admin` only): args `{ email, role }`.
    Looks up the Better Auth user by email; 404s with a clear message if
    none; if a `staffMemberships` row already exists for that subject,
    reactivates/updates its role instead of erroring (idempotent re-add);
    otherwise inserts. Audits `staff.added` or `staff.roleChanged`.
  - `changeStaffRole` mutation (`cms_admin` only): args `{ id, role }`.
    Refuses to demote the last active `cms_admin`. Audits
    `staff.roleChanged`.
  - `setStaffActive` mutation (`cms_admin` only): args `{ id, active }`.
    Refuses to deactivate the last active `cms_admin`. Audits
    `staff.activated` / `staff.deactivated`.
- `src/app/admin/staff/page.tsx`: Server Component, fetches
  `staff:currentStaff` itself (same pattern `admin/layout.tsx` already
  uses) and shows an "Admins only" message instead of the screen for a
  signed-in `cms_editor` — a plain message, not a 404, since this is a
  trusted staff member, not an untrusted request (my call; differs from
  the public-profile not-found pattern, which hides existence from
  strangers).
- `src/lib/admin/admin-navigation.ts`: add a `Staff` entry with a new
  optional `adminOnly?: boolean` field on `AdminNavItem`.
- `src/components/admin/admin-sidebar.tsx` / `admin-shell.tsx`: thread
  `staffRole` through (shell already receives it) so the nav list filters
  out `adminOnly` items for a `cms_editor`. Belt-and-suspenders with the
  page-level gate above, matching how every other admin boundary in this
  repo double-gates (server redirect + hidden nav).
- `documents/DATABASE.md` section 2 / `ARCHITECTURE.md` section 6: note
  that `staffMemberships` rows are now also managed through `/admin/staff`,
  not only the bootstrap path.

## What's left to the builder

Nothing — building this myself next, same session.
