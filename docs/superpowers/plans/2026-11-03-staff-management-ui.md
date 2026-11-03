# Staff Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a `cms_admin` grant/change/revoke CMS staff access from a real `/admin/staff` screen, replacing the current hand-edit-the-Convex-table workflow.

**Architecture:** Four new Convex functions in `convex/staff.ts` (`listStaff`, `addStaffByEmail`, `changeStaffRole`, `setStaffActive`), all `cms_admin`-gated and audited, reusing the existing `staffMemberships` table (no schema change). A new `/admin/staff` page + `AdminStaffClient` component, built from the same pieces `AdminMessagesClient` already uses (`AdminDataTable`, `AdminPageHeader`, `AdminEmptyState`), reachable from a new nav entry hidden from `cms_editor`.

**Tech Stack:** Convex (queries/mutations), `@convex-dev/better-auth`'s component adapter (`authComponent.adapter(ctx).findOne`, `authComponent.getAnyUserById`), Next.js App Router Client Components, existing Tailwind admin design tokens.

**Spec:** `docs/superpowers/specs/2026-11-03-staff-management-ui-design.md`

## Global Constraints

- Server-side authorization only — every new mutation/query re-checks `requireStaff` + `role === "cms_admin"` itself; the UI being admin-only is never the security boundary (spec "Constraints"; matches every existing `cms:*`/`content:*` mutation in this repo).
- `staffMemberships.authSubject` must equal Convex's `tokenIdentifier` for that identity: `${process.env.CONVEX_SITE_URL}|${betterAuthUserId}` — verified from `@convex-dev/better-auth`'s `getAuthConfigProvider` source and the `jwt` plugin's default `sub` claim, but **must also be verified live** before this is called done (spec "Constraints").
- No new table. Approach A only (spec "Approach") — add-by-existing-account-email, never an invite-before-signup flow.
- This repo has zero Convex-side tests (no `convex-test`, no Vitest config) and zero component tests — every `cms:*`/`content:*` mutation so far was verified by `tsc`/`lint` plus live exercise through the Convex dashboard and the browser, not automated tests (see `docs/PHASE1_STATUS_REPORT.md` §3, and this session's own password-reset work). This plan follows that established pattern rather than introducing new test infrastructure: "Write the failing test" steps below are live-verification steps instead, each with an exact, checkable expected result.
- Audit every state-changing mutation via `ctx.db.insert("auditEvents", ...)`, matching `content.ts`'s exact field shape (`actorSubject`, `actorRole`, `action`, `resourceType`, `resourceId`, `metadata`, `createdAt`).
- Match existing code style exactly: `catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }` for mutation error handling (used verbatim in `staff-login-form.tsx`, `delete-confirmation.tsx`, `article-editor-form.tsx`, `page-editor-form.tsx`).

## Review Focus

- A newly-granted staff member's `authSubject` doesn't match what Convex produces at their next sign-in, so they see `reason=not-staff` forever despite a real, active `staffMemberships` row — the single highest-risk failure, and silent (no error, no exception, just permanently denied access). Pinned by Task 1's live-verification step.
- An admin adds an email that has no Better Auth account yet — should fail with a clear, actionable message ("ask them to sign up first"), not a silent no-op, a raw adapter error, or a crash. Pinned by Task 1.
- An admin re-adds an email that already has an (active or deactivated) `staffMemberships` row — should reactivate/update that one row, never create a second row for the same identity. Pinned by Task 1.
- An admin tries to demote or deactivate the *last* active `cms_admin` — must be blocked with a clear error; silently allowing it locks everyone out of `/admin` (`claimFirstStaffAccount`'s self-recovery path only fires when the table is fully empty, not when it's all-editors). Pinned by Task 2.
- Email entered with different case or stray whitespace than how Better Auth stored it (e.g. `Admin@Example.com` vs `admin@example.com`) must still resolve — normalize before lookup. Pinned by Task 1.

---

## Task 1: Backend — resolve-by-email and grant access

**Files:**
- Modify: `convex/staff.ts`
- Test: live verification via `npx convex dev` + the Convex dashboard (no automated test file — see Global Constraints)

**Interfaces:**
- Consumes: `requireStaff(ctx)` (existing, same file), `authComponent` from `./auth` (new import — `auth.ts` does not import `staff.ts`, so this is one-directional, no cycle), `authComponent.adapter(ctx).findOne`, `authComponent.getAnyUserById` (both from `@convex-dev/better-auth`, confirmed in `node_modules/@convex-dev/better-auth/dist/client/create-client.d.ts`).
- Produces (for Task 2 and Task 3 to use):
  - `extractBetterAuthUserId(authSubject: string): string`
  - `buildAuthSubject(betterAuthUserId: string): string`
  - `api.staff.listStaff` query → `{ _id: Id<"staffMemberships">, role: "cms_admin" | "cms_editor", active: boolean, updatedAt: number, email: string | null, name: string | null, isSelf: boolean }[]`
  - `api.staff.addStaffByEmail` mutation, args `{ email: string, role: "cms_admin" | "cms_editor" }` → `{ staffId: Id<"staffMemberships">, created: boolean }`

- [ ] **Step 1: Add the two pure helpers to `convex/staff.ts`**

```typescript
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
```

These invert each other: `extractBetterAuthUserId(buildAuthSubject(x)) === x` for any `x` without a `|`. Add `import { authComponent } from "./auth";` and `import type { Doc, Id } from "./_generated/dataModel";` at the top of the file alongside the existing imports.

- [ ] **Step 2: Add `listStaff` query**

```typescript
export const listStaff = query({
  args: {},
  handler: async (ctx) => { /* ... */ },
});
```

Handler: call `requireStaff(ctx)`; throw `"Only a CMS admin may view the staff roster."` if `staff.role !== "cms_admin"`. `ctx.db.query("staffMemberships").collect()` (whole-table — inherently small, same precedent as `cms.ts`'s `contentPages` reads). For each row, resolve `authComponent.getAnyUserById(ctx, extractBetterAuthUserId(row.authSubject))` and return the object shape listed in Interfaces above (`email`/`name` default to `null` if the user lookup returns `null`, `isSelf` compares `row.authSubject === staff.authSubject`).

- [ ] **Step 3: Add `addStaffByEmail` mutation**

```typescript
export const addStaffByEmail = mutation({
  args: { email: v.string(), role: v.union(v.literal("cms_admin"), v.literal("cms_editor")) },
  handler: async (ctx, args) => { /* ... */ },
});
```

Handler, in order:
1. `const staff = await requireStaff(ctx);` throw `"Only a CMS admin may add staff."` if not `cms_admin`.
2. `const email = args.email.trim().toLowerCase();` throw `"Email is required."` if empty.
3. `const adapter = authComponent.adapter(ctx); const user = await adapter.findOne<{ id: string; email: string; name: string }>({ model: "user", where: [{ field: "email", value: email }] });` throw `` `No account found for ${email}. Ask them to sign up at /sign-in first.` `` if `null`.
4. `const authSubject = buildAuthSubject(user.id);` look up an existing `staffMemberships` row via `.withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject)).unique()`.
5. If found: `ctx.db.patch(existing._id, { role: args.role, active: true, updatedAt: Date.now() })`, audit action `"staff.roleChanged"`, return `{ staffId: existing._id, created: false }`.
6. If not found: `ctx.db.insert("staffMemberships", { authSubject, role: args.role, active: true, invitedBy: staff.authSubject, updatedAt: Date.now() })`, audit action `"staff.added"`, return `{ staffId, created: true }`.
7. Both audit inserts: `resourceType: "staffMemberships"`, `resourceId` = the staff row id, `metadata: { email, role: args.role }`.

- [ ] **Step 4: `npx tsc --noEmit` and `npm run lint` — both clean**

- [ ] **Step 5: Live-verify via the Convex dev deployment (this is the test for this task)**

With `npx convex dev` running: in the browser, sign up a brand-new test account through `/sign-in?intent=signup` with a throwaway email. From the Convex dashboard's function runner (or a temporary call from an already-signed-in `cms_admin` session in the running app), call `addStaffByEmail` with that email and `role: "cms_editor"`. Expected: a new `staffMemberships` row appears with `active: true`. Then sign out of the test account and sign back in through `/staff-login` with its credentials. Expected: lands on `/admin` (not redirected to `reason=not-staff`) — this is what confirms the `authSubject` format is correct, per Global Constraints. Also call `addStaffByEmail` with an email that has never signed up. Expected: throws `No account found for ...`, not a crash or silent success.

- [ ] **Step 6: Commit**

```bash
git add convex/staff.ts
git commit -m "feat(admin): resolve staff by email and grant CMS access (convex/staff.ts)"
```

---

## Task 2: Backend — change role, activate/deactivate, last-admin guard

**Files:**
- Modify: `convex/staff.ts`
- Test: live verification via `npx convex dev` + the Convex dashboard

**Interfaces:**
- Consumes: `requireStaff`, `Doc<"staffMemberships">` (Task 1/existing).
- Produces (for Task 3):
  - `api.staff.changeStaffRole` mutation, args `{ id: Id<"staffMemberships">, role: "cms_admin" | "cms_editor" }` → `{ changed: boolean }`
  - `api.staff.setStaffActive` mutation, args `{ id: Id<"staffMemberships">, active: boolean }` → `{ changed: boolean }`

- [ ] **Step 1: Add the shared guard**

```typescript
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
```

Only fires when `target` is *currently* an active admin — demoting/deactivating a `cms_editor` is never blocked by this. Import `MutationCtx` from `./_generated/server` alongside the existing `QueryCtx` import.

- [ ] **Step 2: Add `changeStaffRole` mutation**

Handler: `requireStaff` + admin check (same message style as Task 1). `const target = await ctx.db.get(args.id); if (!target) throw new Error("Staff record not found.");`. If `target.role === args.role` return `{ changed: false }` (no-op). If the change is a demotion (`args.role === "cms_editor"` and `target.role === "cms_admin"`), call `await assertCanChangeAdminStatus(ctx, target)` first. Then `ctx.db.patch(args.id, { role: args.role, updatedAt: Date.now() })`, audit `"staff.roleChanged"` with `metadata: { from: target.role, to: args.role }`, return `{ changed: true }`.

- [ ] **Step 3: Add `setStaffActive` mutation**

Handler: same auth pattern. `if (target.active === args.active) return { changed: false };`. If deactivating (`args.active === false`), call `assertCanChangeAdminStatus(ctx, target)` first. Patch `{ active: args.active, updatedAt: Date.now() }`, audit action `args.active ? "staff.activated" : "staff.deactivated"` with `metadata: {}`, return `{ changed: true }`.

- [ ] **Step 4: `npx tsc --noEmit` and `npm run lint` — both clean**

- [ ] **Step 5: Live-verify (this is the test for this task)**

Using the test `cms_editor` row from Task 1's verification: call `changeStaffRole` promoting it to `cms_admin`, confirm the row updates. Call `setStaffActive` with `active: false` on the *original* bootstrap `cms_admin` account while the test account is the only other active admin — expected: succeeds (two active admins exist). Now call `setStaffActive` with `active: false` on the test account too (now the last active admin) — expected: throws `"Cannot remove the last active CMS admin."`, and the row is unchanged. Re-activate the original bootstrap account afterward so the deployment isn't left admin-less.

- [ ] **Step 6: Commit**

```bash
git add convex/staff.ts
git commit -m "feat(admin): staff role changes, activation, and the last-admin guard"
```

---

## Task 3: Frontend — `/admin/staff` roster screen

**Files:**
- Create: `src/app/admin/staff/page.tsx`
- Create: `src/components/admin/admin-staff-client.tsx`
- Test: live verification in the browser (no component tests exist anywhere in this repo — see Global Constraints)

**Interfaces:**
- Consumes: `api.staff.currentStaff` (existing), `api.staff.listStaff`, `api.staff.changeStaffRole`, `api.staff.setStaffActive` (Task 1/2), `AdminDataTable`/`AdminColumn` (`@/components/admin/admin-data-table`), `AdminPageHeader` (`@/components/admin/admin-page-header`), `AdminEmptyState` (`@/components/admin/admin-empty-state`), `cn` (`@/lib/utils`).
- Produces (for Task 4): `AdminStaffClient` component, extended in place by Task 4 to add the add-staff form above the table.

- [ ] **Step 1: `src/app/admin/staff/page.tsx`**

Thin server wrapper, same shape as `src/app/admin/messages/page.tsx`: exports `metadata: { title: "Staff" }` and renders `<AdminStaffClient />`.

- [ ] **Step 2: `src/components/admin/admin-staff-client.tsx` — viewer gate and roster table**

`"use client"`. `const viewer = useQuery(api.staff.currentStaff, {});` — three states:
- `viewer === undefined`: loading row, mirroring `AdminMessagesClient`'s `status === "LoadingFirstPage"` block (`<Mail className="animate-pulse-soft" />` style, swap icon for `Users` or `ShieldCheck` from `lucide-react`), text "Loading staff…".
- `viewer === null` or `viewer.role !== "cms_admin"`: render `AdminPageHeader` (title "Staff") plus an `AdminEmptyState` (icon `ShieldAlert` or `Lock` from `lucide-react`, title "Admins only", description "Staff management is restricted to CMS admins. Ask an existing admin if you need a role changed.") — no table, no form.
- `viewer.role === "cms_admin"`: render the full screen (Step 3).

- [ ] **Step 3: Roster table (the `cms_admin` branch)**

`const roster = useQuery(api.staff.listStaff, {});` (always `{}` here, never `"skip"`, since this branch only renders once `viewer.role === "cms_admin"` is already known). `const changeRole = useMutation(api.staff.changeStaffRole);` `const setActive = useMutation(api.staff.setStaffActive);`. Track a per-row `updatingId` the same way `AdminMessagesClient` tracks `updatingId` for `handleStatusChange`, so only the row being changed shows a disabled/pending state.

Columns (`AdminColumn<ListStaffRow>[]`, where `ListStaffRow` is `listStaff`'s return element type):
- "Member" — `row.name ?? "—"` over `row.email ?? "No email on file"`, plus a "You" badge when `row.isSelf`.
- "Role" — a `<select>` identical in structure/styling to `AdminMessagesClient`'s status `<select>`, options `cms_admin`/`cms_editor`, `disabled={updatingId === row._id || row.isSelf}` (an admin should not be able to demote themselves through this control — my call, since the guard would reject it anyway but a disabled control reads better than a thrown error). `onChange` reads `event.target.value as "cms_admin" | "cms_editor"` (same cast style as `handleStatusChange`'s `as MessageStatus`) and calls `changeStaffRole({ id: row._id, role })`.
- "Status" — "Active" / "Deactivated" text plus a toggle button (same outline button class `staff-login-form.tsx`'s claim button uses), `disabled={updatingId === row._id || row.isSelf}`, calling `setStaffActive({ id: row._id, active: !row.active })`.

Both handlers wrap the mutation call in `setUpdatingId(row._id); setActionError(null); try { await ...; } catch (err) { setActionError(err instanceof Error ? err.message : "Something went wrong."); } finally { setUpdatingId(null); }` — deliberately *with* a catch, unlike `AdminMessagesClient`'s `handleStatusChange` (which has none): the last-admin guard's error is an expected, user-facing validation message that must reach the admin, not a rare failure to let propagate unhandled. `actionError` (`React.useState<string | null>(null)`) renders as a `role="alert"` paragraph above the table.

`AdminDataTable` `empty` prop: `AdminEmptyState` icon `Users`, title "No staff yet", description "This should not happen — at least the bootstrap admin account should be listed here." (defensive copy; `listStaff` always includes the viewer's own row).

- [ ] **Step 4: `npx tsc --noEmit` and `npm run lint` — both clean**

- [ ] **Step 5: Live-verify in the browser (this is the test for this task)**

Signed in as a `cms_admin`, navigate directly to `/admin/staff` (no nav link yet — added in Task 4). Expected: roster table lists every `staffMemberships` row including the viewer's own (badged "You", role/status controls disabled on that row). Change another row's role and status; confirm the table updates live and `auditEvents` gains the corresponding rows (check via dashboard). Sign in as the test `cms_editor` account from Task 1 and navigate to `/admin/staff` directly. Expected: "Admins only" message, no table, no form.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/staff/page.tsx src/components/admin/admin-staff-client.tsx
git commit -m "feat(admin): add the /admin/staff roster screen"
```

---

## Task 4: Frontend — add-staff form, nav entry, and copy updates

**Files:**
- Modify: `src/components/admin/admin-staff-client.tsx`
- Modify: `src/lib/admin/admin-navigation.ts`
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/components/admin/staff-login-form.tsx`
- Modify: `documents/DATABASE.md`, `documents/ARCHITECTURE.md`
- Test: live verification in the browser

**Interfaces:**
- Consumes: `api.staff.addStaffByEmail` (Task 1), `AdminStaffClient`'s `cms_admin` branch (Task 3), `AdminNavItem` (existing type in `admin-navigation.ts`).
- Produces: nothing further consumes this task's output — it's the final integration layer.

- [ ] **Step 1: Add-staff form, inside `AdminStaffClient`'s `cms_admin` branch, above the table**

`const addStaff = useMutation(api.staff.addStaffByEmail);` local state for `email`, `role` (default `"cms_editor"`), `submitting`, `formError`. On submit: `event.preventDefault()`, try/catch around `await addStaff({ email, role })` with the standard `err instanceof Error ? err.message : "Something went wrong."` pattern, clear the email field and `formError` on success. Email `<input type="email" required>`, role `<select>` (same two options as the roster table), submit `<button>` using the primary CMS button class from `src/app/admin/pages/page.tsx`/`admin-filter-bar.tsx` (`"inline-flex min-h-11 items-center gap-1.5 rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"`, `disabled:` variant swaps to `bg-action/40 cursor-not-allowed` per `service-editor-form.tsx`), label "Add staff", disabled label "Adding…". `formError` shown as `role="alert"` text, same styling as every other form error in this repo (`text-caption font-medium text-danger`).

- [ ] **Step 2: Add the nav entry, admin-only**

In `src/lib/admin/admin-navigation.ts`: add `adminOnly?: boolean;` to the `AdminNavItem` interface, and a new entry after "Site settings":
```typescript
{
  href: "/admin/staff",
  label: "Staff",
  icon: ShieldCheck, // new import from lucide-react
  description: "CMS staff accounts, roles and access.",
  adminOnly: true,
},
```
Add `staff: "Staff"` to `SEGMENT_LABELS`.

- [ ] **Step 3: Thread `staffRole` into `AdminSidebar` and filter**

`admin-shell.tsx` already receives `staffRole` — pass it through to `<AdminSidebar pathname={pathname} open={sidebarOpen} onClose={close} staffRole={staffRole} />`. In `admin-sidebar.tsx`: add `staffRole: "cms_admin" | "cms_editor";` to `AdminSidebarProps`, and filter the rendered list: `adminNavigation.filter((item) => !item.adminOnly || staffRole === "cms_admin")` before `.map(...)`.

- [ ] **Step 4: Update `staff-login-form.tsx`'s `not-staff` copy**

Replace the line "Ask an existing `cms_admin` to add you in `staffMemberships`" with "Ask an existing `cms_admin` to add you from Admin → Staff" (drop the reference to hand-editing the table, since that's no longer the real workflow).

- [ ] **Step 5: Update docs**

`documents/DATABASE.md` section 2 and `documents/ARCHITECTURE.md` section 6: one line each noting `staffMemberships` rows are now managed through `/admin/staff` (`convex/staff.ts`'s `addStaffByEmail`/`changeStaffRole`/`setStaffActive`), not only the `claimFirstStaffAccount` bootstrap path. Mirror the honest-status-note style already used in `ARCHITECTURE.md` section 6's P2-W1 paragraph.

- [ ] **Step 6: `npx tsc --noEmit`, `npm run lint`, and `npm test` (50/50 expected, unaffected) — all clean**

- [ ] **Step 7: Live-verify end-to-end (this is the test for this task)**

As a signed-in `cms_admin`: confirm "Staff" appears in the sidebar nav, clicking it reaches `/admin/staff`. Use the add-staff form to grant a fresh test account (never signed up) — expected: the clear "No account found" error, not a crash. Have that test account sign up via `/sign-in?intent=signup`, then re-submit the same form with the same email — expected: succeeds, new row appears in the roster. Sign in as a `cms_editor` test account: confirm "Staff" is absent from its sidebar.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/admin-staff-client.tsx src/lib/admin/admin-navigation.ts src/components/admin/admin-sidebar.tsx src/components/admin/admin-shell.tsx src/components/admin/staff-login-form.tsx documents/DATABASE.md documents/ARCHITECTURE.md
git commit -m "feat(admin): add-staff form, Staff nav entry, and doc/copy updates"
```
