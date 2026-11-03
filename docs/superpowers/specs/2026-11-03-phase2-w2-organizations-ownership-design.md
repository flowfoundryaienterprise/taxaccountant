# Phase 2, Week 2 — Organizations, Professional Ownership & Onboarding Wizard

**Status:** Design, awaiting approval.
**Scope:** `IMPLEMENTATION_PLAN.md` P2-W2 only. P2-W3 (private credential evidence + manual
review), P2-W4 (dashboards/favorites/notifications) and P2-W5 (consent/privacy) are separate,
later design docs.

## 1. Intent and why

Phase 1 shipped a public marketplace of staff-curated professional listings with no concept of
the professional themselves having an account. Phase 2 overall turns this into a real two-sided
marketplace: professionals and firms need their own identity, the ability to form an
organization, and a way to end up owning (and eventually editing) a listing. P2-W2 is the
foundation all of that sits on — without it, nothing else in Phase 2 (verification, dashboards,
later leads/quotes in Phase 3) has an org or an ownership record to attach to.

This is also the point where `professionals` records get their first-ever write path. In Phase 1
that table was only ever seeded directly — no staff CMS mutation and no self-serve mutation
exist yet.

## 2. Goals

- A signed-in `appUsers` identity can create an `organizations` record (customer or professional
  firm) and becomes its owner.
- An org can invite other users as members with a role (`owner`/`admin`/`member`/`viewer`).
- A professional-firm org can either **create a brand-new** professional listing from scratch, or
  **claim an existing** one, through the same onboarding wizard.
- Newly created listings start as drafts the org can keep editing and come back to later; claims
  go through a staff review queue before the org gets edit rights.
- All of this is authorized server-side from `ctx.auth` only — no client-supplied `userId`,
  `role`, or ownership flag is ever trusted (AGENTS.md §5).

## 3. Non-goals (this doc)

- Private credential document upload/scanning/manual verification — that's P2-W3
  (`credentialSubmissions`, `verificationChecks`, R2 private evidence).
- Dashboards, favorites, saved searches, notifications — P2-W4.
- Consent records, export/delete requests — P2-W5.
- Any lead/quote/booking flow — Phase 3.

## 4. Anti-goals

- No mechanism that lets a client mark its own listing "verified" or flip `publicationStatus` to
  `published` without a staff action — that's the same invariant Phase 1 already enforces for
  content pages.
- No silent auto-approval of an ownership claim. `professionalOwnership.status` must pass through
  `pending` and a real reviewer decision, even for a claim that looks obviously legitimate.
- No duplicate professional listings created by accident — the claim path exists specifically so
  an org doesn't fork a new record when one already exists for them.

## 5. Constraints

- `DATABASE.md` §3 gives the field-level shape of `organizations`, `organizationMembers`,
  `professionalOwnership` in prose, but **none of these three tables exist in `convex/schema.ts`
  yet** — only `appUsers` (P2-W1) is there today. Authoring the actual Convex validators/indexes
  for these three tables is in scope for this doc (§7.0), not a given.
- Must guard ownership/org-membership/publication/valid-state-transitions inside every function
  (AGENTS.md §5), not just at the UI layer — direct Convex calls with guessed IDs must fail the
  same way the UI does.
- Audit privileged changes (ownership approval/revocation, publication transitions) via
  `auditEvents`, without logging private document contents (none exist yet in this slice).
- Fail closed: missing auth, suspended org, revoked membership, or an uncertain authorization
  state must deny, not default-allow.
- Reuse the existing Better Auth identity — no parallel auth/session model (AGENTS.md §6).

## 6. Approaches considered

**A. Single end-of-wizard submit.** All wizard state lives client-side; one mutation creates
everything atomically on final submit. Simplest to build, but loses all progress on a closed tab
and doesn't match the draft/review/published pattern the rest of the content model uses.

**B. Create-then-autosave (chosen).** Step 1 of the wizard immediately creates the `organizations`
row and, for the "create new" path, a `professionals` row in `publicationStatus: "draft"`. Each
later wizard step is its own small mutation patching that draft. "Submit for review" flips
`draft → review`. Survives a closed tab, matches the CMS content workflow already designed into
the schema, and gives P2-W4's dashboard something to resume.

**C. Separate `onboardingDrafts` staging table**, decoupled from `professionals` until a final
commit mutation. Rejected — more machinery than B for no real benefit, since Convex documents are
already incrementally patchable in place.

Chosen: **B**.

## 7. Decided design

### 7.0 Schema additions (`convex/schema.ts`)

Builder's call, settled here rather than left open, since every function signature below depends
on exact field names:

```ts
organizations: defineTable({
  name: v.string(),
  kind: v.union(v.literal("customer_business"), v.literal("professional_firm")),
  ownerUserId: v.id("appUsers"),
  status: v.union(v.literal("active"), v.literal("suspended")),
  createdAt: v.number(),
}).index("by_owner", ["ownerUserId"]),

organizationMembers: defineTable({
  organizationId: v.id("organizations"),
  userId: v.id("appUsers"),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.literal("viewer")),
  status: v.union(v.literal("invited"), v.literal("active"), v.literal("removed")),
  createdAt: v.number(),
})
  .index("by_org", ["organizationId"])
  .index("by_user", ["userId"])
  .index("by_org_user", ["organizationId", "userId"]), // enforces the unique org/user pair DATABASE.md requires

professionalOwnership: defineTable({
  professionalId: v.id("professionals"),
  organizationId: v.id("organizations"),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("revoked")),
  requestedByUserId: v.id("appUsers"),
  requestedAt: v.number(),
  decidedByAuthSubject: v.optional(v.string()), // staff reviewer; mirrors staffMemberships' identity shape, not an appUsers ref
  decidedAt: v.optional(v.number()),
}).index("by_professional", ["professionalId"])
  .index("by_org", ["organizationId"])
  .index("by_status", ["status"]), // required for listPendingClaims — without it, a global pending-claims query is an unbounded .collect(), which AGENTS.md §5 forbids
```

The reviewer agent's check caught that `DATABASE.md`'s prose listing for `professionalOwnership`
has no timestamp/actor fields and no `by_status` index — both added above. `decidedByAuthSubject`
(not an `appUsers` ref) matches how `convex/staff.ts` already identifies a staff reviewer.

### 7.1 Auth helpers (`convex/organizations.ts`)

Mirrors the existing `requireStaff`/`requireActiveUser` pattern in `convex/staff.ts` /
`convex/users.ts` — identity from `ctx.auth.getUserIdentity()`, fails closed, never trusts a
client-supplied org/role.

- `requireOrgMember(ctx, organizationId)` — looks up the caller's `appUsers` row, then the
  `organizationMembers` row for `(organizationId, userId)`. Throws if no active membership or if
  the org is `suspended`. Returns `{ user, membership }`.
- `requireOrgRole(ctx, organizationId, roles: Role[])` — calls `requireOrgMember`, throws unless
  `membership.role` is in `roles`. Used for invite/remove-member and ownership-claim actions
  (owner/admin only).
- `requireProfessionalEditAccess(ctx, professionalId)` — finds the `professionalOwnership` row
  for that professional with `status: "approved"`, then calls `requireOrgRole` (not plain
  `requireOrgMember`) restricted to `["owner", "admin", "member"]`. `viewer` is deliberately
  excluded — a role named "viewer" that could edit through this choke point would defeat the
  point of having it, and every mutation in §7.4 goes through this one function. This is the
  single choke point every professional-editing mutation (this doc and later ones) goes through.

### 7.2 Organizations

- `createOrganization` (mutation): caller becomes `appUsers`-backed owner; inserts
  `organizations` (`status: "active"`) and `organizationMembers` (`role: "owner"`,
  `status: "active"`).
- `currentOrganizations` (query): orgs the caller is an active member of, with their role.
- `inviteMember` (mutation, owner/admin only): looks up the invitee's Better Auth identity by
  email the same way `addStaffByEmail` does. `organizationMembers.userId` is a real
  `v.id("appUsers")`, not a free-text subject, and `appUsers` rows currently only get created
  lazily by `ensureAppUser` on the invitee's own first sign-in — so if a Better Auth account
  exists for that email but has no `appUsers` row yet, `inviteMember` provisions one server-side
  itself (same insert `ensureAppUser` does, keyed off the looked-up identity's subject), then
  inserts `organizationMembers` with `status: "invited"`. If no Better Auth account exists for
  that email at all, the invite fails with a clear error — an org invite can link to an existing
  identity but can't create a new one. Sends an email via the existing Resend helper pattern in
  `convex/auth.ts` (`RESEND_FROM_ADDRESS`), not a new provider.
- `acceptInvite` / `declineInvite` (mutations, invitee only): flips `status` `invited → active` or
  deletes the row.
- `removeMember` (mutation, owner/admin only): sets `status: "removed"`; cannot remove the last
  `owner`.
- All member-list/role-change mutations audit-log via `auditEvents` (actor, action, target org).

### 7.3 Professional ownership — two entry paths

Both live under `convex/professionalOwnership.ts` and both require `requireOrgRole` (owner/admin)
on the acting org, **and** that the org's `kind === "professional_firm"` — a `customer_business`
org has no legitimate reason to create or claim a listing, and without this check that's a real
authorization hole, not a cosmetic gap.

**Create new** (`createProfessionalDraft`):
1. Inserts a `professionals` row: `publicationStatus: "draft"`, `verificationStatus:
   "not_reviewed"`, `approvedProfile: false`, `featured: false`, caller-supplied `displayName`/
   `kind`/`bio` stub (empty bio allowed at draft stage), slug generated server-side (never
   client-supplied, dedup-checked against `by_slug`).
2. Inserts a `professionalOwnership` row: `status: "approved"` immediately — no ambiguity, the
   org just created this record, there's no prior claimant to verify against.
3. Returns the new `professionalId` so the wizard can route into step 2+.

**Claim existing** (`requestProfessionalClaim`):
1. Caller passes a `professionalId` found via the existing public directory/search (no new search
   endpoint needed — reuses Phase 1's public professional queries).
2. Guards: the professional must not already have an `approved` ownership row (no contested
   double-ownership); the org must not already have a `pending` claim on the same professional
   (no duplicate spam-claims).
3. Inserts `professionalOwnership` row: `status: "pending"`.
4. Does **not** grant edit access — `requireProfessionalEditAccess` only honors `approved` rows,
   so a pending claim is read-only to the claimant, same as everyone else.

**Staff review** (`convex/staff.ts` gains, or a new `convex/verification.ts` — see open item
below): `listPendingClaims` (query, staff only) / `decideClaim` (mutation, staff only,
`approve`/`reject`) — flips `professionalOwnership.status` to `approved` or `revoked`, audit-logs
the decision with the reviewer's identity (never a client-supplied reviewer).

### 7.4 Wizard step mutations (create-new path)

Each is `requireProfessionalEditAccess`-gated and only legal while `publicationStatus === "draft"`
(editing a `published` profile directly is out of scope here — that's a later "manage listing"
surface, not onboarding):

- `updateProfessionalBasics` — `displayName`, `kind`, `firmName`, `bio`, `remoteServices`,
  `inPersonServices`, `publicContactMode`.
- `setProfessionalServices` — replaces the `professionalServices` join rows for this professional.
- `setProfessionalLocations` — replaces `professionalLocations` rows.
- `setProfessionalLanguages` — replaces `professionalLanguages` rows.
- `addPublicCredential` / `removePublicCredential` — writes `professionalPublicCredentials` rows
  with `publicDisplayStatus: "unverified"` (self-declared; P2-W3 is what can later flip a row to
  `"verified"` once real evidence clears manual review — this wizard step never sets `"verified"`
  itself).
- `submitForReview` — guards all required fields are present, flips
  `publicationStatus: "draft" → "review"`. Staff publish/reject mutation is Phase 1 CMS debt
  (professional curator editor backend) that P2-W2 must also deliver, since there was never a
  staff-side write path either — `publishProfessional` / `rejectProfessional` (staff only, in
  `convex/staff.ts` alongside the existing CMS pattern).
  `professionals.publicationStatus` has no `rejected` literal (unlike `credentialSubmissions`,
  which does) — `rejectProfessional` sets `review → draft`, non-terminal, and records the reason
  on the `auditEvents` entry rather than adding a new schema state. The org sees the listing back
  in its draft list and can edit and resubmit through the same `submitForReview` mutation; no
  separate "rejected" UI state to design for this slice. (If a harder terminal "rejected, contact
  support" UX turns out to be wanted later, that's an additive schema change, not a blocker now.)

### 7.5 Frontend routes (per `PRD.md`'s Phase 2 route list)

- `/organization/new`, `/organization/[id]` — org creation + member management.
- `/professional/onboarding` — the wizard (create-new or claim-existing entry).
- `/admin/verification/claims` — staff claim-review queue (new admin section, same
  `requireStaff`-gated layout pattern as existing `/admin/*`).

`/professional/dashboard/*` is explicitly P2-W4 scope, not built here — P2-W2 only needs enough
of a post-submit landing state ("draft saved, here's what's next") to not dead-end the wizard.

### 7.6 Audit events

New `auditEvents` entries for: org created, member invited/removed/role-changed, professional
draft created, claim requested, claim approved/rejected, profile submitted for review, profile
published/rejected. No message bodies or document contents logged (none exist in this slice
anyway).

## 8. What's left to the builder

- Exact wizard step ordering/copy and client-side form validation UX — judgment call, not a
  product decision.
- Whether claim-review and publish-review live in one `/admin/verification` section or stay split
  (claims under `/admin/verification`, publish-review under the existing `/admin` CMS nav) is a
  minor information-architecture call the builder can make and note.
- Slug generation scheme (e.g. `firmName` + disambiguating suffix) — follow whatever pattern, if
  any, Phase 1's seed data already used for `professionals.slug`.
