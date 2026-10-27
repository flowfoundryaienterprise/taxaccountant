# Day 6 — Phase 1 Admin CMS Foundation

**Branch:** `feat/frontend`
**Scope:** CMS frontend, reusable admin components, Convex schema review.
No authentication, no authorization services, no mutations, no verification
workflow, no uploads.

---

## 1. The security decision, first

### What exists today

There is **no authentication anywhere in this project**. Verified on Day 6:
no Better Auth integration, no `convex/auth.config.ts`, no `ctx.auth` call,
no session, no role check. `/sign-in` is an explainer page, not a login.

So there was no authorization contract to reuse, and the brief's rule —
"Do not deploy an unprotected admin dashboard… keep all unfinished CMS
routes out of public production" — had to be met by construction.

### What was measured before choosing

A runtime guard inside the route was tried first and **rejected on
evidence**. A probe route containing `if (process.env.CMS_PREVIEW !==
"enabled") notFound()` was built and the output inspected: vinext keeps that
as a runtime lookup, so the marker string, the component tree and the fixture
data were all still present in the production Worker bundle. Code that ships
can be reached by a bug, a stray env var or a misconfiguration.

Also measured along the way: vinext excludes `__`-prefixed directories from
routing entirely (an early probe at `/__probe` silently never existed), and
application modules do **not** receive arbitrary shell env vars — only
`NEXT_PUBLIC_*` is inlined.

### What was built

A Vite plugin, `cms-production-exclusion` in `vite.config.ts`. `vite.config.ts`
runs in Node, so it *can* read the real shell environment. Unless
`CMS_PREVIEW=enabled` is set for the command, every module under
`src/app/admin/` is replaced — before any other plugin sees it — with a stub
that calls `notFound()`. The CMS components and fixtures are then
unreferenced and drop out of the bundle.

**Verified both directions:**

| Build | `/admin` HTTP | CMS strings in `.cloudflare/output/` |
|---|---|---|
| `npm run build` (production) | **404** | 0 |
| `CMS_PREVIEW=enabled npm run build` | renders | present |

Final production audit greps for nine CMS markers plus both unpublished
professional slugs: **all zero**. Served assets contain no
`CONVEX_DEPLOYMENT`, `R2_`, `CLOUDFLARE_API` or `AUTH_SECRET` string.

### What this is not

**This is a build gate, not authorization.** It keeps unfinished screens out
of production; it does not make them safe to expose. Before `/admin` may be
enabled in any deployed environment it needs, at minimum:

1. Server-side authentication (Better Auth, per ARCHITECTURE.md section 6).
2. A staff role check on every request, derived server-side from the session
   — never from a client-supplied value.
3. Authorized Convex queries that enforce the public/private boundary **in
   the query**, not in the component.
4. An audit event on every write.

Running the CMS locally: `CMS_PREVIEW=enabled npm run dev`.

---

## 2. A real defect this work caught

While auditing the production bundle, both **unpublished professional
fixtures** (`atlas-fiscal-group`, `helena-fischer`) were found compiled into
the deployed Worker.

The cause was my own Day 5 change. Day 5 initially held those rows in a
separate array, the build tree-shook them away, and the "unpublished profile
is blocked" test therefore passed for the wrong reason — the slug simply did
not exist. The fix at the time moved them into the same lookup map the public
route reads, so the publication gate would do the rejecting. That made the
gate meaningful but put unapproved records into a public module, and they
shipped.

**Resolved on Day 6.** The public module (`profile-fixtures.ts`) now builds
its lookup from published rows only. The unpublished fixtures moved to
`src/lib/admin/admin-unpublished-fixtures.ts`, which only the CMS imports and
which is stripped from production. The gate in `getPublishedProfile` is
unchanged and still runs on every lookup.

The right principle, stated plainly: **the strongest form of "unpublished
records are inaccessible" is that the public side never holds them.** A gate
over data that should not be there is weaker than not shipping the data. The
gate still matters — it is what will reject draft rows once
`professionals:getPublishedBySlug` returns real records — and it must be
enforced server-side in that query too.

Re-verified: 0 occurrences of either slug anywhere in the production output.

---

## 3. Screens implemented

| Route | Contents | Data |
|---|---|---|
| `/admin` | Six counters, quick actions, recent-content table | Mixed |
| `/admin/pages` | Search, status filter, pagination, table | Demonstration |
| `/admin/pages/new`, `/admin/pages/[id]/edit` | Full editor + SEO + blocks | Demonstration |
| `/admin/services` | Service table, "where a change appears" note | **Approved** |
| `/admin/services/new`, `/admin/services/[id]/edit` | Editor with locked slug | **Approved** |
| `/admin/countries` | Country table, four facts kept separate | **Approved** |
| `/admin/countries/[id]` | Info, activation, jurisdictions, services, listings, SEO | **Approved** |
| `/admin/jurisdictions` | Taxonomy table, country filter | **Approved** |
| `/admin/professionals` | Listing table incl. unpublished | **Approved** |
| `/admin/professionals/[id]` | Full listing record + credential summary | **Approved** |
| `/admin/articles` | Table with author / reviewer / review date | Demonstration |
| `/admin/articles/new`, `/admin/articles/[id]/edit` | Editor + jurisdiction + review state | Demonstration |
| `/admin/media` | Asset grid, upload requirements | Demonstration |
| `/admin/seo` | Cross-content SEO overview, duplicate-canonical check | **Approved** |
| `/admin/settings` | Six setting groups, implemented vs pending | Mixed |

Plus `loading.tsx`, `error.tsx` and `not-found.tsx` for the subtree.

### Approved vs demonstration data

This distinction is rendered on every screen as a `ProvenanceNotice`, not
buried in a comment.

- **Approved** — projected from the modules the public site already renders
  (`serviceCatalog`, `countryCatalog`, `jurisdictionOptions`, the
  professional fixtures). The CMS shows what is genuinely live and cannot
  drift from it.
- **Demonstration** — pages, articles and media have no source at all;
  `contentPages` and `mediaAssets` hold no rows and nothing has been
  authored. Clearly-labelled fixtures populate those screens so the table,
  filter, pagination and form behaviour can be reviewed.

Media rows all point at files already shipped in `public/` and listed in
`ATTRIBUTIONS.md` — no private asset, no object key, no credential.

---

## 4. What is operational vs UI-only

**Operational (really works):** navigation, search, status/country filters,
pagination, sorting, the mobile drawer, form validation with inline and
summary errors, slug generation, slug-format and uniqueness checks, the
unsaved-change indicator, the structured block editor (add/remove/reorder),
the media picker, the SEO search-appearance preview, and the
duplicate-canonical detector.

**UI-only (disabled, with the reason shown):** every save, publish, delete
and upload. No mutation exists and no authentication exists to authorize
one. Nothing fakes a successful write — the brief's "do not implement fake
successful saves" is enforced by there being no success path at all. The
forms do run validation, so the rules can be agreed before the backend is
written.

The delete dialog is built (type-the-name-to-confirm, `<dialog>` for free
focus and Escape handling) with its final button permanently disabled: a
destructive action needs permissions and an audit record, neither of which
exists.

---

## 5. Reusable components

`src/components/admin/`: `admin-shell`, `admin-sidebar`, `admin-header`,
`admin-page-header`, `admin-data-table`, `admin-filter-bar`,
`admin-pagination`, `admin-status-badge`, `admin-stat-card`,
`admin-empty-state`, `admin-skeleton`, `admin-notices`, `admin-form-field`
(text / textarea / select), `seo-fields`, `content-editor`,
`delete-confirmation`, `media-picker`, `page-editor-form`,
`service-editor-form`, `article-editor-form`.

`src/lib/admin/`: `admin-types`, `admin-navigation`, `admin-formatters`,
`admin-validation`, `admin-list`, `admin-data`, `admin-fixtures`,
`admin-unpublished-fixtures`.

Reused rather than duplicated: `Breadcrumbs` (the shared one, as
`AdminBreadcrumbs` would have been a second copy), `BrandLogo`, `cn`, the
brand tokens. `AdminEmptyState` is deliberately *not* the public
`EmptyState` — the public one is a marketing surface with CTA buttons, this
one explains an editorial state and offers no action it cannot perform.

### Two design decisions worth recording

**No rich-text editor.** `ContentEditor` is a typed array of four block
kinds holding plain text. Beyond the dependency-size argument, a WYSIWYG
field stores markup, and CMS markup is the classic injection surface;
DESIGN.md asks for "no embedded executable HTML". Blocks render without
`dangerouslySetInnerHTML` and cannot carry a script. Reordering uses
explicit move buttons rather than drag-and-drop, because buttons are
keyboard- and screen-reader-accessible without a parallel implementation.

**No fake account area.** The brief allows a user/account area "only if
actual authentication data is available". There is none, so the header shows
the environment instead. An invented "Signed in as Admin" chip would be
precisely the fiction the brief rules out.

---

## 6. Convex schema review

### Existing entities — all supported, no change required

| Need | Collection | Verdict |
|---|---|---|
| Content pages | `contentPages` | Supported (`kind`, `locale`, `seo`, `status`, author/reviewer subjects) |
| Articles | `contentPages` kind `blog` + `contentCategories` | Supported |
| Service categories | `serviceCategories` | Supported, `seo` required not optional |
| Countries | `countries` | Supported, incl. the four separate flags |
| Tax jurisdictions | `taxJurisdictions` | Supported, `countryId` + `level` + `parentId` |
| Professionals | `professionals` + 4 child tables | Supported |
| Media | `mediaAssets` | Supported, incl. `scanStatus` and `approvalStatus` |
| Site settings | `siteSettings` | Supported; documented as non-secret allowlist |
| Publication status | every content collection | Supported |
| Editorial review metadata | `contentPages.reviewerSubject` / `publishedAt` | Partially — see gap below |

### Relationship checks

| Question | Answer |
|---|---|
| Service has a unique canonical slug? | `by_slug` index exists; **uniqueness is not enforced by Convex** — the mutation must check |
| Country has a unique ISO code? | `by_code` exists; same caveat |
| Jurisdiction belongs to a country? | Yes, `countryId: v.id("countries")` |
| Professional has a publication status? | Yes, plus a separate `approvedProfile` gate |
| Articles associable with jurisdictions? | **No — gap, see below** |
| Drafts distinguishable from published? | Yes, on every content collection |
| Public queries exclude unpublished? | Must be enforced in the query; no such query exists yet |

### Index review — no new index added

Every lookup these screens need already has one: `contentPages.by_slug_locale`
and `by_kind_status`, `serviceCategories.by_slug` and
`by_publication_status`, `countries.by_code` and `by_discoverable_status`,
`taxJurisdictions.by_country` and `by_code`, `professionals.by_slug`,
`by_publication_status` and `by_featured`, `mediaAssets.by_approval_visibility`,
`siteSettings.by_key`, `contentPageCategories.by_page` / `by_category`.

Adding anything would have been redundant against current query patterns, so
**nothing was added.**

### Gaps documented, not changed

| Gap | Why it was not changed on Day 6 |
|---|---|
| `contentPages` has no `jurisdictionId` | Real gap. A jurisdiction-specific article shown as universal is a genuine harm, and the CMS form already has the field. But adding it affects a collection whose block schema is still open (DATABASE.md leaves `body` undecided until day 16-17), so it belongs with that work rather than ahead of it. |
| No `reviewedAt` on `contentPages` | `reviewerSubject` records *who*, not *when*. The articles screen needs both to distinguish "assigned for review" from "reviewed". Same deferral reason. |
| Slug uniqueness not enforced at the DB level | Convex has no unique constraint; this is a mutation-level check. Recorded so it is not forgotten when writes land. |
| `professionals.featured` unused | The homepage highlights are still hard-coded reference-design fixtures. |

No schema change was made on Day 6 — the two real gaps belong to the CMS
content work, and changing a collection ahead of the module that will own it
would be guessing at its shape.

### Required authorized functions

**Queries (staff-only, role-checked server-side):**
```
cms:listPages(status?, q?, cursor?)        cms:getPage(id)
cms:listArticles(status?, category?, …)    cms:getArticle(id)
cms:listServices()                         cms:listCountries()
cms:listJurisdictions(countryCode?)        cms:listProfessionals(status?, …)
cms:listMedia(type?, cursor?)              cms:seoOverview()
settings:getAll()                          // distinct from public settings:getPublic
```

**Mutations (every one needs a role check + an audit event):**
```
content:saveDraft / requestReview / publish / unpublish   (API.md section 3)
professionals:upsertCuratedDraft / setPublication
taxonomy:manageCountry / manageServices
media:requestUpload / completeUpload / approvePublicAsset / removeAsset
settings:update
```

**Approval blockers:** Better Auth is not integrated; no staff identity
exists to attribute a change to; `staffMemberships` has rows for nobody;
country activation needs the approved activation checklist before it can be
made editable; R2 is not configured.

---

## 7. Testing performed

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass |

**Routes** — all eleven top-level CMS routes return 200 under
`CMS_PREVIEW=enabled npm run dev`; all return **404** in the production
preview. Nine public routes (`/`, `/find-accountant`, `/services`,
`/services/[slug]`, `/countries`, `/countries/US`, `/professionals/[slug]`,
`/for-professionals`, `/sign-in`) still return 200 with their header and
footer intact, and no admin markup.

**Filtering** — `/admin/pages?status=review` returns "2 of 8 pages match"
and excludes the published rows; `/admin/professionals?status=suspended`
returns only the suspended record.

**Forms** (driven in-browser, not inspected statically):

| Input | Result |
|---|---|
| Empty submit | Error summary + 2 inline errors |
| "Privacy Policy" → generate slug | `privacy-policy` |
| Slug `about` (existing) | "'about' is already in use. Slugs must be unique." |
| Slug `Not A Valid Slug!` | Format guidance with a correct example |
| Valid unique input | "Validation passed… Nothing has been saved" |

**Responsive** (measured in sized iframes):

| Width | Page h-scroll | Sidebar | Toggle |
|---|---|---|---|
| 375 | none | `fixed`, `translate: -100%` (off-canvas) | visible |
| 768 | none | off-canvas | visible |
| 1024 | none | `sticky`, docked, main offset 280px | hidden |
| 1440 | none | docked | hidden |

Wide tables scroll inside their own `overflow-x-auto` region (`role="region"`,
`tabIndex=0`, so a keyboard user can reach and scroll them) while the page
itself never scrolls sideways.

**Accessibility** — on `/admin/pages/new`: 1 `<h1>`, all 8 form controls
labelled, 0 unnamed buttons, 0 unnamed links, required fields carry
`aria-required`, the disabled Save carries a `title` explaining why, and
landmarks are labelled (`aside[CMS sections]`, `nav[CMS navigation]`,
`nav[Breadcrumb]`, `main`). Errors use `role="alert"`, successes
`role="status"`.

---

## 8. Known issues

1. **`notFound()` returns HTTP 200 in dev.** Pre-existing vinext behaviour
   carried over from Day 5 — it affects the Day 4 and Day 5 routes
   identically. It does **not** affect the CMS exclusion: in a production
   build `/admin` returns a genuine 404, because the stub hits the global
   not-found handler rather than a route-level one.
2. **Public chrome is serialized but not rendered on `/admin` in dev.**
   `SiteChrome` is a client component receiving server-rendered `header` and
   `footer` as props, so React renders them into the RSC payload even when
   the admin branch discards them. Confirmed not in the DOM (no public
   footer, no primary nav, exactly one `<main>`). Costs nothing in
   production, where `/admin` does not exist. Eliminating it entirely would
   mean splitting the app into `(public)` and `(admin)` route groups with
   separate root layouts — a larger change than Day 6 should make.
3. **The CMS reads no Convex data at all.** Every screen is a UI preview.
4. **Two schema gaps deferred** (article jurisdiction, article `reviewedAt`)
   — see section 6.

---

## 9. Day 6 acceptance checklist

| Item | Status |
|---|---|
| Shared CMS layout created | PASS |
| Responsive admin sidebar created | PASS |
| Dashboard overview screen created | PASS |
| Pages management UI created | PASS |
| Services management UI created | PASS |
| Countries management UI created | PASS |
| Tax jurisdictions interface created | PASS |
| Professional listings management UI created | PASS |
| Articles management UI created | PASS |
| Media library UI created | PASS |
| SEO management UI created | PASS |
| Website settings UI created | PASS |
| Reusable table component implemented | PASS |
| Reusable form fields implemented | PASS |
| Draft/published states represented | PASS |
| Empty/loading/error states implemented | PASS |
| Convex schema reviewed | PASS — no change needed, 2 gaps documented |
| No insecure write operations introduced | PASS — no write path exists |
| Unprotected CMS excluded from production | PASS — build-gated and verified |
| Responsive behavior tested | PASS at 375 / 768 / 1024 / 1440 |
| Existing public marketplace pages preserved | PASS |
| TypeScript checks pass | PASS |
| Lint passes | PASS |
| Production build passes | PASS |
| All changes remain on `feat/frontend` | PASS |

**Day 6 status: COMPLETE.**
