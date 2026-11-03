# Phase 2, Week 2 — Organizations, Professional Ownership & Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a signed-in customer/professional identity the ability to form an organization, and give a professional-firm org a way to end up — via a create-new or claim-existing path — owning a draft `professionals` listing it can edit and submit for staff publication.

**Architecture:** Three new Convex tables (`organizations`, `organizationMembers`, `professionalOwnership`) plus two new function files (`convex/organizations.ts`, `convex/professionalOwnership.ts`) following the existing `requireStaff`/`requireActiveUser` auth-helper pattern. The onboarding wizard is create-then-autosave: step 1 creates a draft `professionals` row server-side, every later step patches it. Staff review reuses the `content.ts` draft→review→published state-machine shape, added to `convex/staff.ts`.

**Tech Stack:** Convex (mutations/queries/schema), `convex-test` + Vitest + `@edge-runtime/vm` for backend tests (none of this is installed yet — Task 1), React/vinext frontend, Better Auth (`@convex-dev/better-auth`) for identity.

**Spec:** `docs/superpowers/specs/2026-11-03-phase2-w2-organizations-ownership-design.md`

## Global Constraints

- Guard referenced IDs, ownership, organization membership, publication, and valid state transitions **inside every function**, not just the UI (AGENTS.md §5).
- No client privilege from a submitted `userId`, `role`, `status`, or similar boolean/enum (AGENTS.md §5) — every mutation derives identity from `ctx.auth.getUserIdentity()`.
- Fail closed: missing auth, suspended org, revoked/removed membership, or an uncertain authorization state must deny, not default-allow (AGENTS.md §6).
- Avoid unbounded `.collect()` and full-table client filtering — query by index (AGENTS.md §5); this is why `professionalOwnership` gets a `by_status` index in Task 2.
- Audit privileged changes via `auditEvents`, using the exact shape already in `convex/schema.ts:365-378` (`actorSubject`, `actorRole`, `action`, `resourceType`, `resourceId`, `metadata`, `createdAt`) — never log message bodies or document contents (AGENTS.md §5).
- Use `identity.tokenIdentifier` for all auth-linked lookups, never `identity.subject` — matches every existing helper (`convex/staff.ts:22-27`, `convex/users.ts:15-20`).
- Slugs and other identifiers are always generated/validated server-side, never trusted from the client (mirrors `convex/content.ts`'s `assertUniqueSlug`).

## Review Focus

- A caller invokes a wizard-step mutation (e.g. `updateProfessionalBasics`) with a `professionalId` their org does not own — must throw, not silently no-op or leak the record. (Task 5)
- A `customer_business` org calls `createProfessionalDraft` or `requestProfessionalClaim` — must be rejected; only `professional_firm` orgs may own a listing. (Task 5)
- An org member with role `viewer` calls any wizard-step mutation — must be rejected; only `owner`/`admin`/`member` may edit. (Task 5)
- `inviteMember` is called twice for the same already-active member, or for an email with no Better Auth account at all — must not duplicate the membership row, demote an existing role, or silently succeed with no account. (Task 4)
- `requestProfessionalClaim` is called for a `professionalId` that already has an `approved` ownership row — must be rejected; no contested double-ownership. (Task 5)

---

## Task 1: Convex test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `convex/healthCheck.test.ts`
- Modify: `package.json:scripts` (add `test:convex`)

**Interfaces:**
- Produces: a working `convexTest(schema, modules)` harness every later task's tests call, per `convex/_generated/ai/guidelines.md`'s testing section (`convex-test`, Vitest, `environment: "edge-runtime"`, module map via `import.meta.glob("./**/*.ts")`).

- [ ] **Step 1: Install dependencies**

Run: `npm install -D convex-test vitest @edge-runtime/vm`

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
```

- [ ] **Step 3: Write a smoke test proving the harness works end-to-end, including a Better Auth action, since Task 4 depends on `auth.api.signUpEmail` working inside `convex-test`**

`convex/healthCheck.test.ts`:
```ts
/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("status query runs", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.healthCheck.status, {});
  expect(result).toBeDefined();
});

test("devProvision.signUpStaff creates a Better Auth user inside the test harness", async () => {
  const t = convexTest(schema, modules);
  const result = await t.action(internal.devProvision.signUpStaff, {
    email: "smoke-test@example.com",
    password: "correct-horse-battery-staple",
    name: "Smoke Test",
  });
  expect(result.email).toBe("smoke-test@example.com");
});
```

- [ ] **Step 4: Add `"test:convex": "vitest run convex"` to `package.json` scripts and run it**

Run: `npm run test:convex`
Expected: both tests PASS. If the second test fails because `convex-test` can't simulate the `@convex-dev/better-auth` component, stop and resolve that before Task 4 — every later test that needs a real Better Auth identity depends on this working.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts convex/healthCheck.test.ts package.json package-lock.json
git commit -m "test: add convex-test/vitest harness for Convex function tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Schema additions

**Files:**
- Modify: `convex/schema.ts` (add three tables after `appUsers`, line 414)

**Interfaces:**
- Produces: `organizations`, `organizationMembers`, `professionalOwnership` tables exactly as specified in the design doc §7.0 — every later task's argument/return types reference these field names verbatim.

- [ ] **Step 1: Add the three tables to `convex/schema.ts`**

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
  .index("by_org_user", ["organizationId", "userId"]),

professionalOwnership: defineTable({
  professionalId: v.id("professionals"),
  organizationId: v.id("organizations"),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("revoked")),
  requestedByUserId: v.id("appUsers"),
  requestedAt: v.number(),
  decidedByAuthSubject: v.optional(v.string()),
  decidedAt: v.optional(v.number()),
})
  .index("by_professional", ["professionalId"])
  .index("by_org", ["organizationId"])
  .index("by_status", ["status"]),
```

- [ ] **Step 2: Verify the schema compiles**

Run: `npx convex dev --once` (or `npm run typecheck` if that's faster — either must succeed with no schema errors)
Expected: no errors; Convex accepts the new tables as an additive, non-breaking schema change (AGENTS.md §5: "additive migrations... never reset production data" — no existing table is touched).

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add organizations, organizationMembers, professionalOwnership tables

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Organization creation and membership read

**Files:**
- Create: `convex/organizations.ts`
- Test: `convex/organizations.test.ts`

**Interfaces:**
- Consumes: `appUsers` table (`convex/users.ts`'s `ensureAppUser` shape — `authSubject`, `displayName`, `accountStatus`, `createdAt`).
- Produces (used by Tasks 4, 5, 7):
  - `requireOrgMember(ctx: QueryCtx, organizationId: Id<"organizations">): Promise<{ user: Doc<"appUsers">, membership: Doc<"organizationMembers">, organization: Doc<"organizations"> }>` — throws if no active membership or org is suspended.
  - `requireOrgRole(ctx: QueryCtx, organizationId: Id<"organizations">, roles: Array<"owner"|"admin"|"member"|"viewer">): Promise<ReturnType<typeof requireOrgMember>>` — throws unless the caller's role is in `roles`.
  - `createOrganization` (mutation): args `{ name: string, kind: "customer_business"|"professional_firm" }` → `{ organizationId: Id<"organizations"> }`.
  - `currentOrganizations` (query): args `{}` → `Array<{ organizationId: Id<"organizations">, membershipId: Id<"organizationMembers">, name: string, kind: string, role: string }>`. `membershipId` is included from the start so Task 4's `removeMember` and Task 8's member-list UI have a concrete row to address — it's the caller's own membership row, not the one being listed in a roster (that's `listOrgMembers`, added in Task 8).

- [ ] **Step 1: Write failing tests for `createOrganization` and `currentOrganizations`**

```ts
/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

test("createOrganization makes the caller the owner", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "firm-owner@example.com");

  const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const orgs = await asUser.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(1);
  expect(orgs[0]).toMatchObject({ organizationId, name: "Acme Tax LLP", role: "owner" });
});

test("currentOrganizations is empty for a user with no org", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "nobody@example.com");
  expect(await asUser.query(api.organizations.currentOrganizations, {})).toEqual([]);
});

test("createOrganization requires sign-in", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.organizations.createOrganization, { name: "X", kind: "customer_business" }),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:convex`
Expected: FAIL — `convex/organizations.ts` does not exist yet.

- [ ] **Step 3: Implement `convex/organizations.ts`**

Mirror `convex/staff.ts`'s file-level shape: a local, unexported `lookupAppUser(ctx, authSubject)` helper matching the one in `convex/users.ts:15-20` (same query shape, by the `appUsers.by_auth_subject` index) — duplicated here rather than exported from `users.ts`, since this task only touches `convex/organizations.ts`. Then `requireOrgMember`/`requireOrgRole` as plain exported `async function`s (not Convex functions — same shape as `requireStaff`), then the two Convex functions. `requireOrgMember` throws `"Not signed in."` with no identity, `"Not an active member of this organization."` with no active `organizationMembers` row, and `"This organization is suspended."` if `organization.status !== "active"`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:convex`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/organizations.ts convex/organizations.test.ts
git commit -m "feat: add organization creation and membership auth helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Organization membership — invite, accept, decline, remove

**Files:**
- Modify: `convex/organizations.ts`
- Modify: `convex/organizations.test.ts`

**Interfaces:**
- Consumes: `requireOrgRole` (Task 3); `createAuth`/`buildAuthSubject` pattern from `convex/staff.ts:44-49,193-200` (email → Better Auth user → `authSubject`).
- Produces (used by frontend Task 8):
  - `inviteMember` (mutation): args `{ organizationId: Id<"organizations">, email: string, role: "admin"|"member"|"viewer" }` → `{ membershipId: Id<"organizationMembers"> }`.
  - `acceptInvite` / `declineInvite` (mutations): args `{ organizationId: Id<"organizations"> }` → `{}`.
  - `removeMember` (mutation): args `{ membershipId: Id<"organizationMembers"> }` → `{}`.

- [ ] **Step 1: Write failing tests**

Cover: (a) inviting a user who already has an `appUsers` row — membership created with `status: "invited"`; (b) inviting an email with a Better Auth account but no `appUsers` row yet — `inviteMember` provisions the `appUsers` row itself (assert it now exists via `currentOrganizations` after the invitee calls `acceptInvite`); (c) inviting an email with **no** Better Auth account at all — throws; (d) a `viewer` calling `inviteMember` — throws (role guard); (e) re-inviting an already-`active` member — does not duplicate the row or change their role (Review Focus item 4); (f) `removeMember` on the sole `owner` — throws.

```ts
test("inviteMember provisions appUsers for a Better Auth account with no appUsers row yet", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "owner@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  // Invitee has a Better Auth account but has never called ensureAppUser.
  await t.action(internal.devProvision.signUpStaff, {
    email: "invitee@example.com",
    password: "correct-horse-battery-staple",
    name: "Invitee",
  });

  await owner.mutation(api.organizations.inviteMember, {
    organizationId,
    email: "invitee@example.com",
    role: "member",
  });

  const asInvitee = t.withIdentity({ subject: "invitee@example.com", issuer: "https://example.convex.site" });
  await asInvitee.mutation(api.organizations.acceptInvite, { organizationId });
  const orgs = await asInvitee.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(1);
});

test("inviteMember throws for an email with no Better Auth account", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "owner2@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });
  await expect(
    owner.mutation(api.organizations.inviteMember, {
      organizationId,
      email: "nobody@example.com",
      role: "member",
    }),
  ).rejects.toThrow();
});

test("removeMember refuses to remove the sole owner", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "owner3@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });
  const orgs = await owner.query(api.organizations.currentOrganizations, {});
  await expect(
    // membershipId isn't returned by currentOrganizations today — fetch it
    // the same way removeMember's own test setup needs to; see Step 3 note.
    owner.mutation(api.organizations.removeMember, { membershipId: orgs[0].membershipId }),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:convex`
Expected: FAIL — functions don't exist yet.

- [ ] **Step 3: Implement `inviteMember`, `acceptInvite`, `declineInvite`, `removeMember`**

`inviteMember`: `requireOrgRole(ctx, organizationId, ["owner", "admin"])`; look up the Better Auth user by email using the exact pattern in `convex/staff.ts:193-200` (`createAuth(ctx).$context.adapter.findOne`); throw `No account found for ${email}. Ask them to sign up at /sign-in first.` (mirrors `addStaffByEmail`'s message) if none; derive `authSubject` via `buildAuthSubject` (export it from `convex/staff.ts` if not already exported, or duplicate the 6-line function — duplicating is fine here per DRY-vs-coupling judgment, since importing creates a two-way dependency between `staff.ts` and `organizations.ts` for a trivial string template); look up `appUsers` by `authSubject`, insert one (`accountStatus: "active"`, no `displayName`) if missing; check `organizationMembers` `by_org_user` for an existing row — if `status: "active"`, return it unchanged (no demotion, no duplicate); otherwise insert/patch to `status: "invited"`. Audit-log `organization.memberInvited`.

`acceptInvite`/`declineInvite`: find the caller's own `organizationMembers` row by `by_org_user`; require `status === "invited"`; patch to `"active"` or delete.

`removeMember`: `requireOrgRole` (owner/admin) on the target row's `organizationId`; if target role is `"owner"`, count other `active` owners via `by_org` — throw if this is the last one; patch `status: "removed"`; audit-log `organization.memberRemoved`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:convex`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/organizations.ts convex/organizations.test.ts
git commit -m "feat: add organization invite/accept/decline/remove member mutations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Professional ownership — create-new and claim-existing entry points

**Files:**
- Create: `convex/professionals.ts` (minimal public query, prerequisite the design doc assumed existed but doesn't)
- Create: `convex/professionalOwnership.ts`
- Test: `convex/professionalOwnership.test.ts`

**Interfaces:**
- Consumes: `requireOrgRole` (Task 3); `professionals` table (`convex/schema.ts:103-154`).
- Produces (used by Tasks 6, 7, 9):
  - `convex/professionals.ts`: `searchPublishedProfessionals` (query): args `{ nameQuery: string }` → `Array<{ professionalId: Id<"professionals">, displayName: string, firmName?: string, slug: string }>`, filtered to `publicationStatus: "published"` via the existing `by_publication_status` index, substring-matched on `displayName`/`firmName` server-side (small result set per AGENTS.md — this is a bounded index scan, not a full-table filter).
  - `requireProfessionalEditAccess(ctx: QueryCtx, professionalId: Id<"professionals">): Promise<{ organization: Doc<"organizations">, ownership: Doc<"professionalOwnership"> }>`.
  - `createProfessionalDraft` (mutation): args `{ organizationId: Id<"organizations">, displayName: string, kind: "individual"|"firm" }` → `{ professionalId: Id<"professionals"> }`.
  - `requestProfessionalClaim` (mutation): args `{ organizationId: Id<"organizations">, professionalId: Id<"professionals"> }` → `{ ownershipId: Id<"professionalOwnership"> }`.

- [ ] **Step 1: Write failing tests**

Cover: (a) `createProfessionalDraft` succeeds for a `professional_firm` org owner, creates `publicationStatus: "draft"` + an `approved` ownership row; (b) `createProfessionalDraft` throws for a `customer_business` org (Review Focus item 2); (c) `createProfessionalDraft` throws for a `viewer` (Review Focus item 3); (d) `requestProfessionalClaim` creates a `pending` ownership row and `requireProfessionalEditAccess` still rejects the claimant (no edit access while pending); (e) `requestProfessionalClaim` throws if the professional already has an `approved` ownership row (Review Focus item 5); (f) a direct call to a wizard-gated check with another org's `professionalId` throws (Review Focus item 1 — exercised concretely once Task 6 adds a real wizard-step mutation to call it through; a minimal version here can call `requireProfessionalEditAccess` directly).

```ts
test("createProfessionalDraft rejects a customer_business org", async () => {
  const t = convexTest(schema, modules);
  const owner = await signedInUser(t, "customer@example.com");
  const { organizationId } = await owner.mutation(api.organizations.createOrganization, {
    name: "Jane's Bakery",
    kind: "customer_business",
  });
  await expect(
    owner.mutation(api.professionalOwnership.createProfessionalDraft, {
      organizationId,
      displayName: "Jane Doe CPA",
      kind: "individual",
    }),
  ).rejects.toThrow();
});

test("requestProfessionalClaim rejects a professional that already has an approved owner", async () => {
  const t = convexTest(schema, modules);
  const firstOrg = await signedInUser(t, "firm-a@example.com");
  const { organizationId: orgA } = await firstOrg.mutation(api.organizations.createOrganization, {
    name: "Firm A", kind: "professional_firm",
  });
  const { professionalId } = await firstOrg.mutation(api.professionalOwnership.createProfessionalDraft, {
    organizationId: orgA, displayName: "Firm A Lead", kind: "individual",
  });

  const secondOrg = await signedInUser(t, "firm-b@example.com");
  const { organizationId: orgB } = await secondOrg.mutation(api.organizations.createOrganization, {
    name: "Firm B", kind: "professional_firm",
  });
  await expect(
    secondOrg.mutation(api.professionalOwnership.requestProfessionalClaim, {
      organizationId: orgB, professionalId,
    }),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:convex`
Expected: FAIL

- [ ] **Step 3: Implement**

`createProfessionalDraft`: `requireOrgRole(ctx, organizationId, ["owner", "admin"])`; throw if `organization.kind !== "professional_firm"`; generate slug server-side (lowercase, hyphenate `displayName`, strip non-alphanumerics, append `-2`/`-3`... on collision against `by_slug`); insert `professionals` with `publicationStatus: "draft"`, `verificationStatus: "not_reviewed"`, `approvedProfile: false`, `featured: false`, `bio: ""`, `remoteServices: false`, `publicContactMode: "contact_form"`, `updatedAt: Date.now()`; insert `professionalOwnership` with `status: "approved"`, `requestedByUserId`, `requestedAt`; audit-log `professional.draftCreated`.

`requestProfessionalClaim`: same role+kind guards; throw if an `approved` `professionalOwnership` row already exists for this `professionalId` (`by_professional` index); throw if the caller's org already has a `pending` row for this professional; insert `professionalOwnership` `status: "pending"`; audit-log `professional.claimRequested`.

`requireProfessionalEditAccess`: query `professionalOwnership` `by_professional` for `status: "approved"`; throw `"Your organization does not own this listing."` if none; call `requireOrgRole(ctx, ownership.organizationId, ["owner", "admin", "member"])`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:convex`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/professionals.ts convex/professionalOwnership.ts convex/professionalOwnership.test.ts
git commit -m "feat: add professional ownership create-new and claim-existing paths

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Onboarding wizard step mutations

**Files:**
- Modify: `convex/professionalOwnership.ts`
- Modify: `convex/professionalOwnership.test.ts`

**Interfaces:**
- Consumes: `requireProfessionalEditAccess` (Task 5).
- Produces (used by frontend Task 9):
  - `updateProfessionalBasics` (mutation): args `{ professionalId, displayName, kind, firmName?, bio, remoteServices, inPersonServices?, publicContactMode }` → `{}`.
  - `setProfessionalServices` (mutation): args `{ professionalId, services: Array<{ serviceId: Id<"serviceCategories">, taxJurisdictionId: Id<"taxJurisdictions">, remote: boolean, description?: string }> }` → `{}`.
  - `setProfessionalLocations` (mutation): args `{ professionalId, locations: Array<{ countryId: Id<"countries">, city: string, region?: string, publicLocationText?: string, isPrimary: boolean }> }` → `{}`.
  - `setProfessionalLanguages` (mutation): args `{ professionalId, languageIds: Array<Id<"languages">> }` → `{}`.
  - `addPublicCredential` (mutation): args `{ professionalId, designation: string, issuer?: string, jurisdictionId?: Id<"taxJurisdictions"> }` → `{ credentialId: Id<"professionalPublicCredentials"> }`.
  - `removePublicCredential` (mutation): args `{ credentialId: Id<"professionalPublicCredentials"> }` → `{}`.
  - `submitForReview` (mutation): args `{ professionalId }` → `{}`.

- [ ] **Step 1: Write failing tests**

Cover: (a) a happy path through basics → services → locations → languages → credential → `submitForReview`, asserting `publicationStatus` ends at `"review"`; (b) calling any wizard-step mutation with a `professionalId` the caller's org doesn't own throws (Review Focus item 1, now exercised through a real wizard mutation); (c) `submitForReview` throws if `displayName` or at least one service/location is missing; (d) a wizard-step mutation on a `professionals` row already in `"review"` (not `"draft"`) throws.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:convex`
Expected: FAIL

- [ ] **Step 3: Implement**

Each mutation: `const { ownership } = await requireProfessionalEditAccess(ctx, args.professionalId)`; load the `professionals` doc; throw `Cannot edit a listing that is not in draft.` unless `publicationStatus === "draft"`. `setProfessionalServices`/`setProfessionalLocations`/`setProfessionalLanguages` are replace-style: delete all existing join rows for `professionalId` via their `by_professional` index, insert the new set (mirrors how `content.ts`'s `saveDraft` treats the whole record as the source of truth). `submitForReview`: guard `displayName` non-empty and at least one `professionalServices`/`professionalLocations` row exists (via `by_professional` `.first()` on each, not `.collect()`); patch `publicationStatus: "review"`; audit-log `professional.submittedForReview`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:convex`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/professionalOwnership.ts convex/professionalOwnership.test.ts
git commit -m "feat: add onboarding wizard step mutations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Staff review — claims and publication

**Files:**
- Modify: `convex/staff.ts`
- Test: `convex/staff.test.ts` (new — Task 1 only smoke-tested `healthCheck`; this is the first real coverage of `requireStaff`-gated functions)

**Interfaces:**
- Consumes: `requireStaff` (`convex/staff.ts`, existing).
- Produces (used by frontend Task 10):
  - `listPendingClaims` (query, staff only): args `{}` → `Array<Doc<"professionalOwnership"> & { professionalDisplayName: string, organizationName: string }>`, via the `by_status` index from Task 2.
  - `decideClaim` (mutation, staff only): args `{ ownershipId: Id<"professionalOwnership">, decision: "approve"|"reject" }` → `{}`.
  - `listProfessionalsPendingReview` (query, staff only): args `{}` → `Array<Doc<"professionals">>`, via the existing `professionals.by_publication_status` index (`convex/schema.ts:153`) filtered to `"review"`. Added so Task 10 has something to drive a publish-review queue from — `submitForReview` (Task 6) otherwise has no reachable UI to act on it.
  - `publishProfessional` (mutation, staff only): args `{ professionalId: Id<"professionals"> }` → `{}`.
  - `rejectProfessional` (mutation, staff only): args `{ professionalId: Id<"professionals">, reason: string }` → `{}`.

- [ ] **Step 1: Write failing tests**

Cover: (a) a `cms_editor` or non-staff caller is rejected by all five functions; (b) `decideClaim` approve flips `status: "pending" → "approved"`, sets `decidedByAuthSubject`/`decidedAt`; (c) `decideClaim` reject flips to `"revoked"`; (d) `listProfessionalsPendingReview` returns only `"review"`-status rows, not `"draft"`/`"published"` ones; (e) `publishProfessional` throws unless `publicationStatus === "review"`; (f) `rejectProfessional` sets `publicationStatus: "review" → "draft"` (non-terminal, per design doc §7.4) and the record is editable again afterward (assert a Task 6 wizard mutation succeeds post-reject).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:convex`
Expected: FAIL

- [ ] **Step 3: Implement in `convex/staff.ts`**

Each: `const staff = await requireStaff(ctx)`. `listPendingClaims`: query `professionalOwnership` `by_status` for `"pending"`, join in `professionals.displayName`/`organizations.name` per row (small result set, bounded by actual pending-claims volume). `decideClaim`: load the ownership row, require `status === "pending"`, patch to `"approved"`/`"revoked"` with `decidedByAuthSubject: staff.authSubject`, `decidedAt: Date.now()`; audit-log `professional.claimDecided`. `listProfessionalsPendingReview`: query `professionals` `by_publication_status` for `"review"`. `publishProfessional`: require `publicationStatus === "review"`; patch `publicationStatus: "published"`, `approvedProfile: true`; audit-log `professional.published`. `rejectProfessional`: require `publicationStatus === "review"`; patch `publicationStatus: "draft"`; audit-log `professional.rejected` with `metadata: { reason: args.reason }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:convex`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/staff.ts convex/staff.test.ts
git commit -m "feat: add staff claim review and professional publish/reject mutations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Frontend — organization creation and member management

**Files:**
- Create: `src/app/organization/new/page.tsx`
- Create: `src/app/organization/[id]/page.tsx`
- Create: `src/components/organization/create-organization-form.tsx`
- Create: `src/components/organization/member-list.tsx`

**Interfaces:**
- Consumes: `api.organizations.createOrganization`, `api.organizations.currentOrganizations`, `api.organizations.inviteMember`, `api.organizations.removeMember` (Tasks 3, 4).
- Produces: `api.organizations.listOrgMembers` (this task's own Step 2 — not produced by any earlier task).

No `convex-test` coverage for this task (no component-test harness exists in this repo — `package.json`'s `test` script only covers `src/lib/**/*.test.ts`, and AGENTS.md/the project's established pattern relies on typecheck + build + manual verification for frontend, same as every prior Phase 1/2 frontend task).

- [ ] **Step 1: Build `create-organization-form.tsx`** — name input, kind radio (`customer_business`/`professional_firm`), calls `useMutation(api.organizations.createOrganization)`, redirects to `/organization/[id]` on success. Follow the existing form pattern in `src/components/shared/account-auth-form.tsx` (controlled inputs, inline error paragraph, `role="alert"`).

- [ ] **Step 2: Add `listOrgMembers` (query, `requireOrgMember`-gated) to `convex/organizations.ts`** — args `{ organizationId: Id<"organizations"> }` → `Array<Doc<"organizationMembers"> & { email: string | null }>`, via the `by_org` index. Neither Task 3's `currentOrganizations` (the caller's own org list) nor any other task produces a full member roster for one org — this is the first and only place that's needed.

- [ ] **Step 3: Build `member-list.tsx`** — renders `listOrgMembers` rows for the given org, an invite form (email + role select) wired to `inviteMember`, and a remove button per row wired to `removeMember`, each disabled appropriately by the viewer's own role (read from `currentOrganizations`).

- [ ] **Step 4: Wire the two page routes**, both requiring a signed-in `appUsers` identity (reuse the redirect-to-`/sign-in` pattern `/admin/*` layouts already use for staff, adapted for plain account auth).

- [ ] **Step 5: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 6: Manual verification** — sign up a fresh account, create a `professional_firm` org, invite a second (pre-existing) test account by email, confirm it shows `status: "invited"`, accept it from the second account's session, confirm `member-list` now shows it active.

- [ ] **Step 7: Commit**

```bash
git add src/app/organization src/components/organization
git commit -m "feat: add organization creation and member management UI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Frontend — professional onboarding wizard

**Files:**
- Create: `src/app/professional/onboarding/page.tsx`
- Create: `src/components/professional/onboarding-wizard.tsx`
- Create: `src/components/professional/claim-search.tsx`

**Interfaces:**
- Consumes: `api.professionalOwnership.createProfessionalDraft`, `requestProfessionalClaim`, `updateProfessionalBasics`, `setProfessionalServices`, `setProfessionalLocations`, `setProfessionalLanguages`, `addPublicCredential`/`removePublicCredential`, `submitForReview` (Tasks 5, 6); `api.professionals.searchPublishedProfessionals` (Task 5).

- [ ] **Step 1: Build the entry screen** — "Create a new listing" vs. "Claim an existing listing" choice. Claim path renders `claim-search.tsx` (text input → `searchPublishedProfessionals`, select a result → `requestProfessionalClaim`, then redirect to a "claim pending staff review" landing state — not into the wizard, since a pending claim has no edit access per Task 5).

- [ ] **Step 2: Build `onboarding-wizard.tsx`** for the create-new path — one step per Task 6 mutation (basics, services, locations, languages, credentials, review), each step's "Next" button calling that step's mutation before advancing, matching the create-then-autosave design (§6 approach B). Final step calls `submitForReview` and shows the post-submit landing state the design doc §7.5 calls for ("draft saved, here's what's next" — no dashboard to link to yet, since that's P2-W4).

- [ ] **Step 3: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual verification** — walk both paths end-to-end: create-new through to `submitForReview`, and claim-existing against a fixture professional, confirming the pending-claim landing state renders and no wizard-step mutation is reachable for it.

- [ ] **Step 5: Commit**

```bash
git add src/app/professional src/components/professional
git commit -m "feat: add professional onboarding wizard (create-new and claim-existing)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Frontend — staff claim review queue

**Files:**
- Create: `src/app/admin/verification/claims/page.tsx`
- Create: `src/app/admin/verification/listings/page.tsx`
- Create: `src/components/admin/claims-queue.tsx`
- Create: `src/components/admin/listing-review-queue.tsx`

**Interfaces:**
- Consumes: `api.staff.listPendingClaims`, `api.staff.decideClaim`, `api.staff.listProfessionalsPendingReview`, `api.staff.publishProfessional`, `api.staff.rejectProfessional` (Task 7); reuses the existing `requireStaff`-gated `/admin/*` layout pattern (`src/components/admin/staff-login-form.tsx`'s surrounding layout, or wherever `/admin/staff` currently composes its guard).

This task covers both staff review surfaces `submitForReview` (Task 6) and `requestProfessionalClaim` (Task 5) need: without it, those mutations would have no reachable UI to act on their results.

- [ ] **Step 1: Build `claims-queue.tsx`** — table of `listPendingClaims` rows (professional name, organization name, requested date) each with Approve/Reject buttons calling `decideClaim`.

- [ ] **Step 2: Build `listing-review-queue.tsx`** — table of `listProfessionalsPendingReview` rows (`displayName`, `kind`, `updatedAt`) each with a Publish button calling `publishProfessional` and a Reject button that collects a short reason and calls `rejectProfessional`.

- [ ] **Step 3: Wire `/admin/verification/claims` and `/admin/verification/listings`** under the existing `/admin` staff-gated route group, with a small nav between the two (resolves the design doc §7.5 open IA question: both live under one `/admin/verification` section).

- [ ] **Step 4: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: no errors.

- [ ] **Step 5: Manual verification** — as a staff account: (a) approve a pending claim created in Task 9's manual test, confirm the claimant org gains edit access; (b) publish a listing submitted for review in Task 9's manual test, confirm it now appears with `publicationStatus: "published"`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/verification src/components/admin/claims-queue.tsx src/components/admin/listing-review-queue.tsx
git commit -m "feat: add staff claim and listing review queues

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
