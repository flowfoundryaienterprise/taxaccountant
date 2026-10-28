# Day 7 — CMS Content Integration, Data Contracts & Editorial Workflow

**Branch:** `feat/frontend`
**Scope:** typed content contracts, editorial workflow UI, public content
integration, Convex schema. No authentication, no authorization services, no
mutations.

---

## 1. The finding that shapes this day

**The only Convex function in this project is `healthCheck:status`, and it
touches no table.** Verified by reading `convex/` and the generated API
surface: zero content queries, zero mutations, zero authentication, zero
authorization.

So the brief's headline objective — "connect the CMS frontend to approved
data contracts" — has no approved data contract to connect to. The brief
anticipates this twice and says what to do instead:

> §5: "If the approved query is unavailable, implement a typed adapter
> interface and document the pending integration."
> §17: "If authorization is unavailable, prioritize typed frontend
> integration and local CMS previews rather than unsafe production CRUD."

That is what Day 7 delivers. **Backend integration itself is BLOCKED**, and
is reported as such in the acceptance checklist rather than dressed up.

---

## 2. Convex schema — two fields added

Both were documented as gaps on Day 6 and deliberately deferred. This
brief's own field lists now require them (§4 "Reviewer, when applicable",
"Last reviewed date", "Jurisdiction association"; §10 "Distinguish publish
date from last-reviewed date"), so the justification exists and they are
added.

```ts
// convex/schema.ts — contentPages
jurisdictionId: v.optional(v.id("taxJurisdictions")),
reviewedAt: v.optional(v.number()),
```

**`jurisdictionId`** — `contentPages` could say which country and which
service a page related to, but not which tax jurisdiction, despite that
being the distinction the whole product rests on. An article describing one
authority's treatment, rendered without naming the authority, reads as a
universal statement. That is the exact harm §10's tax-content rules exist to
prevent, and it cannot be prevented if the record has nowhere to say what it
applies to.

**`reviewedAt`** — `reviewerSubject` records *who*, `publishedAt` records
when it went live. Neither answers "when was this last checked", which for
tax content is the more important question: content can sit published for a
year after its last review.

**Compatibility:** both optional, so no existing document becomes invalid
and no backfill is required. An absent `reviewedAt` means "not reviewed" and
the UI renders it that way — it never falls back to the publish date.

**Indexes: none added.** Every lookup these screens perform is served by an
existing index (`by_slug_locale`, `by_kind_status`, `by_country_kind`). A
paginated public resource listing ordered by publish date would want
`by_kind_status_published`, but no query exists to validate that access
pattern against, and adding an index to match a guessed query shape is how
redundant indexes accumulate. Recorded as a recommendation, not applied.

---

## 3. The typed data layer

| Module | Purpose |
|---|---|
| `src/lib/cms/content-types.ts` | The two repository contracts and their types |
| `src/lib/cms/content-status.ts` | Editorial states and legal transitions |
| `src/lib/cms/content-validation.ts` | Publish-readiness checks |
| `src/lib/cms/content-formatters.ts` | Dates, datelines, disclaimers |
| `src/lib/cms/content-adapter.ts` | Staff repository (fixture-backed) |
| `src/lib/cms/public-content-adapter.ts` | Public repository (empty) |
| `src/lib/marketplace/content-mappers.ts` | CMS record → public projection |
| `src/lib/marketplace/public-content-types.ts` | Public page view models |

### Two repositories, not one with a flag

`ContentRepository` is the staff contract and can see drafts.
`PublicContentRepository` returns only published, public-safe projections,
and **its return types have no field for a status, an author subject or an
internal note** — so a public component cannot render one even by mistake.

They are separate types deliberately. A single repository with an
`includeDrafts?: boolean` is one forgotten argument away from leaking
unpublished content onto a public page; a missing field is a compile error.

Each method names the Convex function it stands in for, so the backend has a
concrete contract rather than a blank page.

---

## 4. A leak caught and closed

The public and staff repositories were initially **one module**. That gave
the public `/resources` route an import edge to the CMS fixtures, and a
production build was measured carrying the article fixture source into the
Worker bundle's sourcemaps.

The executable JS was clean — the bundler tree-shook the unused data — but
that is luck, not design. Tree-shaking is an optimisation, not a guarantee,
and the identical mistake on Day 5 did ship unapproved records into
executable code.

**Fixed by splitting the module.** `public-content-adapter.ts` imports no
fixture module at all, so there is no import edge for a bundler to follow.
That is a stronger property than a filter applied to data that is already in
reach — the same lesson as the Day 6 professionals fix, applied before it
could become a real exposure.

Re-verified: zero occurrences of any CMS fixture string anywhere in
`.cloudflare/output/`, sourcemaps included.

---

## 5. Editorial workflow

Draft → Review → Published → (Draft | Archived), mirroring
`contentPages.status` exactly. **"Unpublished" is deliberately not a fifth
state**: unpublishing returns content to `draft`, which is what the schema
can store. A status the database cannot represent is a status the UI must
not offer.

Every control is **disabled**, and the bar distinguishes two reasons:

- a **validation blocker** ("No editorial review has been recorded") is
  actionable by the editor, so it is shown in preference; and
- the **missing backend** reason, which is not actionable from that screen.

Each control also names the mutation it will call (`content:publish`,
`content:requestReview`, …), so the pending contract is concrete.

### The tax-content rule, enforced in code

`articlePublishIssues` blocks publication when an article has no recorded
review — and requires **both** a reviewer and a review date, because a name
with no date or a date with no name is a half-filled field, not a review.
An image without alt text is a blocker too, not a warning: shipping an
inaccessible image is a defect, not a preference.

These are advisory and the publish mutation must repeat them. A caller that
skips the UI skips these.

---

## 6. Public content integration

### `/resources` and `/resources/[slug]` — new, and deliberately empty

Both routes read through `publicContentRepository`, which returns nothing,
so `/resources` renders an honest empty state and every resource slug 404s.

**That is the correct outcome, not an unfinished one.** The CMS fixtures
include articles marked published with a reviewer and a review date. Routing
the public site at them would put fictional tax guidance on indexable public
pages under a real brand — exactly what Days 5 and 6 went to some length to
avoid for professional profiles.

So the public set is genuinely empty until real reviewed content is
authored, and the boundary is demonstrable: **`/resources/cross-border-filing-obligations`
is a published article in the CMS and returns HTTP 404 publicly.**

Unlike the directory and profile routes, `/resources` is **indexable** —
safely, because it serves only published reviewed content and currently
serves none, so it indexes an honest empty state rather than fixtures.

### Navigation

"Tax Guides" in the header Resources menu and "Resources" in the footer now
point at `/resources` instead of a homepage anchor. Tax Calendar and
Glossary stay locked: those are separate features that do not exist, and a
lock is more honest than a link to a page that does not answer the question
the label asks.

### What is NOT connected, and why

The homepage, `/services`, `/services/[slug]`, `/countries`,
`/countries/[countryCode]` and `/find-accountant` were **left alone**.

They already read one shared module each (`serviceCatalog`,
`countryCatalog`, the directory fixtures), so the "avoid inconsistent names
and slugs across screens" requirement is already satisfied — verified on
Day 6. Routing them through a new adapter that resolves to the same modules
would add a layer and change nothing, while risking regressions in five
working pages. The brief's §11 safeguard is explicit: "Do not redesign the
homepage during Day 7."

They become adapter reads when there is a real query behind it.

---

## 7. Operational vs UI-only

**Operational:** navigation, search, filters, pagination, field validation,
publish-readiness checks, the content preview (renders live form state
through the same block renderer the public pages use), the unsaved-changes
guard (`beforeunload` plus an in-app dialog), the media picker, the SEO
preview, and the public resources routes with their empty and not-found
states.

**UI-only, disabled with the reason shown:** Save Draft, Submit for Review,
Publish, Unpublish, Archive, Delete, and media upload. No mutation exists
and no authentication exists to authorize one.

### Preview security

The preview renders **inside the editor** from React state. There is no
`/preview/[token]` route and no shareable draft URL — an unauthenticated URL
that renders unpublished content is a content leak with extra steps (§13).
Nothing administrative is rendered into the previewed markup; the draft
banner is chrome outside the previewed region.

---

## 8. Testing

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass |

**Routes** — 10 public routes and 11 CMS routes return 200 in dev;
`/resources/<any slug>` returns 404 including the CMS-published slug.

**Public boundary** — `/resources` HTML contains **zero** occurrences of any
CMS fixture string (`cross-border`, `Editorial team`) in raw markup, not
just in visible text. Production bundle audit: 8 CMS marker strings, all 0.

**Publish gate** — `/admin/articles/article-audit/edit` (status `review`, no
recorded review) renders "No editorial review has been recorded" as the
blocker on Publish, and the workflow buttons carry both `title` and
`aria-describedby`.

**Responsive** — 375 / 768 / 1024 / 1440 on the article editor and
`/resources`: no page-level horizontal scroll, zero overflowing elements.

**Accessibility** — one `<h1>` per screen, no skipped heading levels, zero
unnamed buttons or links, zero images without `alt`.

### Two defects found and fixed during verification

1. **Duplicate `<h1>`** — `ContentPreview` rendered the previewed title as
   an `h1`, mirroring the public page, but it is nested inside an editor
   screen that already owns the page's `h1`. Now an `h2` with identical
   visual treatment: fidelity of appearance does not require duplicating a
   landmark heading.
2. **Skipped heading level** — `ContentValidationSummary` used `h3`
   directly under the screen's `h1`. Now `h2`.

### BLOCKED

**Permission-boundary testing is BLOCKED and reported as such** (§18).
There is no authentication, no role, and no authorized query, so there is
nothing to test an unauthorized caller against. What *was* verified is the
content boundary: unpublished content does not reach public pages, and no
CMS data reaches the production bundle. That is a different and weaker
guarantee than access control, and it is not a substitute for it.

---

## 9. Remaining backend dependencies

**Staff queries** (each needs an authenticated staff identity + role check):
`cms:listPages`, `cms:getPage`, `cms:listArticles`, `cms:getArticle`.

**Public queries** (must filter by publication status **in the query**):
`content:listPublishedResources`, `content:getPublishedBySlug`.

**Mutations** (each needs a role check and an audit event):
`content:saveDraft`, `content:requestReview`, `content:publish`,
`content:unpublish`.

**Blockers:** Better Auth is not integrated; no staff identity exists;
`staffMemberships` has rows for nobody; R2 is not configured.

---

## 10. Day 7 acceptance checklist

| Item | Status |
|---|---|
| Existing CMS implementation inspected | PASS |
| Convex content schema reviewed | PASS |
| Typed data contracts created or reused | PASS |
| CMS overview integrated where authorized | **BLOCKED** — no authorized query exists |
| Pages listing and editing UI refined | PASS |
| Services CMS integrated with approved contracts | **BLOCKED** — no contract; reads the shared live module |
| Country/jurisdiction CMS prepared | PASS |
| Articles and resources CMS refined | PASS |
| Homepage dynamic-content opportunities reviewed | PASS — reviewed, deliberately not changed |
| Editorial status components created | PASS |
| Draft/review/publish UI states implemented | PASS |
| Content preview interface implemented | PASS |
| SEO data fields integrated | PASS |
| Media selection prepared | PASS |
| Public pages exclude unpublished data | PASS — verified at the HTML level |
| No unprotected privileged mutations introduced | PASS — no mutation exists |
| No insecure CMS production exposure | PASS — build gate intact, re-verified |
| Responsive design verified | PASS at 375 / 768 / 1024 / 1440 |
| Days 2–6 functionality preserved | PASS |
| TypeScript checks pass | PASS |
| Lint passes | PASS |
| Build passes | PASS |
| Changes remain on `feat/frontend` | PASS |

**Day 7 status: PARTIALLY COMPLETE.** Every frontend deliverable is done and
verified. The three backend-integration items are BLOCKED on contracts that
do not exist, and are reported as blocked rather than claimed.
