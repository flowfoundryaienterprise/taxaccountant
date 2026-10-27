# Day 5 — Professional Profile Detail Page

**Branch:** `feat/frontend`
**Scope:** frontend, UI/UX and approved Convex schema review only. No backend
functions, no auth, no booking, no payments, no messaging, no dashboards.

---

## 1. What shipped

One canonical professional profile route, `/professionals/[slug]`, with
loading, not-found and error states, wired into every existing entry point
(homepage highlights, directory cards, service pages, country pages, and the
related-professionals strip on the profile itself).

### Scheduling note

`IMPLEMENTATION_PLAN.md` places the profile page on Day 10 and
`professionals:getPublishedBySlug` on the same day. The Day 5 brief brought
the **frontend** forward and explicitly forbade implementing backend
services here, so the page is built against a typed fixture module shaped
exactly like the eventual query projection. The Convex query is still
outstanding — see section 10.

---

## 2. Screens

### `/professionals/[slug]`

| Section | Source | Empty-state behavior |
|---|---|---|
| Breadcrumbs (Home → Find an Accountant → name) | `Breadcrumbs` (Day 4) | n/a |
| Profile header: portrait, name, designation, firm, location, jurisdictions, languages, consultation, 3 primary actions | `professionals` + joins | Portrait falls back to initials avatar |
| Development-preview notice | static | always shown |
| About *[name]* | `professionals.bio` | honest "no profile summary supplied" panel |
| Services & specialties | `professionalServices` + `serviceCategories` | honest "no service categories listed" panel |
| Countries & tax jurisdictions served | `professionalLocations` / `professionalServices` | "no tax jurisdictions listed" line |
| Qualifications & credentials | `professionalPublicCredentials` | honest "no credentials listed" panel |
| Languages & consultation preferences | `professionalLanguages`, `remoteServices`, `inPersonServices` | "none listed" / "not stated" |
| At a glance + On this page (sticky aside) | derived | n/a |
| Contact section | `publicContactMode` | honest "no contact channel enabled" state |
| Profile FAQs | derived from the profile | hidden if empty (never is) |
| Explore similar tax professionals | overlap match over Day 3 fixtures | honest "no comparable profiles" panel |
| Mobile action bar (`<640px`) | — | n/a |

Primary actions are **Contact Professional**, **Explore Services** and
**Back to Search Results**. There is deliberately no Book Appointment
control: booking is Phase 3 and nothing on the page represents availability.

### `/professionals/[slug]` — not found

One page answers three causes — mistyped slug, never-published profile, and
suspended/archived profile — with identical wording and no detail about the
record, so it cannot confirm that an unpublished profile exists
(API.md section 1).

---

## 3. Truthfulness rules applied

These are the rules the page is built to enforce, not aspirations:

1. **No verified badge without a real review.** `isGenuinelyVerified()`
   requires *both* `publicDisplayStatus === "verified"` **and** a
   `reviewedAt` timestamp, which only a completed documentary review writes.
   A fixture, a seed script or a mistakenly flipped enum cannot produce a
   badge on its own. Every credential currently renders
   "Not yet verified by the marketplace".
2. **No fabricated experience.** The presentation model carries no field for
   years of experience, client counts, awards, previous employers or
   professional memberships, so no component can render one. Biographies
   exist on 6 of 16 fixtures and describe only the kind of work covered.
3. **No fabricated coverage.** A service is only ever attached to
   jurisdictions the professional already states. The per-service mapping in
   the fixtures can *narrow* coverage but is filtered against the
   professional's own jurisdiction list and can never widen it.
4. **Location ≠ authorization.** Practice location, tax jurisdiction and
   authorization are three separately headed blocks, and the Authorization
   block states plainly that no authorization check has been carried out.
5. **No simulated contact.** Every fixture is `publicContactMode: "none"`,
   so the contact section renders an honest availability message instead of
   a dead button. No form is rendered, and the section carries an explicit
   warning never to send tax IDs, banking details or documents through a
   public channel.
6. **No invented availability.** No working hours, appointment slots,
   timezone or real-time status anywhere; the languages section says so.
7. **No ratings, reviews or fees.** The model has no such fields. Every
   occurrence of the words "rating"/"review"/"fee" in the rendered page is in
   copy explaining their absence.
8. **No credential documents or licence numbers.** Not in the model, not on
   the page.
9. **No dates.** `updatedAt` is omitted rather than filled with a
   plausible-looking timestamp.
10. **No indexing.** Every profile page is `noindex, follow`, and no
    `Person`/`ProfessionalService` JSON-LD is emitted, because the facts
    behind it are not real.

---

## 4. Components

### Created

| File | Purpose |
|---|---|
| `src/app/professionals/[slug]/page.tsx` | The one canonical profile route (Server Component) |
| `src/app/professionals/[slug]/loading.tsx` | Skeleton sized like the real page (4:5 portrait, same grid) |
| `src/app/professionals/[slug]/not-found.tsx` | Invalid / unpublished / suspended — one identical answer |
| `src/app/professionals/error.tsx` | Route error boundary; generic message + `digest` only |
| `src/components/professionals/profile-header.tsx` | Portrait, identity, facts, primary actions |
| `src/components/professionals/professional-overview.tsx` | About + empty state |
| `src/components/professionals/professional-services.tsx` | Service cards with per-service jurisdictions |
| `src/components/professionals/jurisdiction-coverage.tsx` | Location / jurisdiction / authorization, separated |
| `src/components/professionals/credentials-section.tsx` | Credentials with the two-condition verification gate |
| `src/components/professionals/languages-section.tsx` | Languages + consultation preferences |
| `src/components/professionals/contact-professional.tsx` | Contact CTA, branching on `publicContactMode` |
| `src/components/professionals/related-professionals.tsx` | Reuses the Day 3 `ProfessionalCard` |
| `src/components/professionals/profile-action-bar.tsx` | Mobile-only bottom action strip |
| `src/components/professionals/profile-preview-notice.tsx` | Development-fixture honesty notice |
| `src/lib/professionals/profile-types.ts` | Typed contract mirroring the Convex collections |
| `src/lib/professionals/profile-fixtures.ts` | Development fixtures + the publication gate |
| `src/lib/professionals/profile-formatters.ts` | Display helpers, related matching, FAQs |

### Reused unchanged

`Breadcrumbs`, `SectionHeading`, `EmptyState`, `Container`, `PortraitImage`,
`AvatarInitials`, `CountryBadge`, `ServiceFaq`/`FaqAccordion`,
`buttonVariants`, `serviceCatalog`, `jurisdictionOptions`, `toCardModel`.

No duplicate component was created: every shared primitive the brief listed
(`Breadcrumbs.tsx`, `SectionHeading.tsx`, `EmptyState.tsx`) already existed
from Day 4 and was reused rather than re-added.

### Modified

| File | Change |
|---|---|
| `src/lib/marketplace/query-params.ts` | Added `PROFESSIONALS_PATH` and `professionalHref(slug, returnTo?)` — the single place profile URLs are built |
| `src/components/directory/professional-results.tsx` | `cta="pending"` → real link, carrying the committed search as `?from=` |
| `src/app/find-accountant/page.tsx` | Serializes the active filters once and passes them to the cards |
| `src/components/shared/professional-preview.tsx` | `cta="pending"` → real link (service & country pages) |
| `src/components/home/featured-professionals.tsx` | Day 2 highlights now link to the same canonical route |
| `src/lib/home-content.ts` | `DemoProfessional.profileSlug` maps the four demo identities to their directory slugs |
| `src/components/shared/professional-card.tsx` | Doc comment only; `cta="pending"` retained as an escape hatch |
| `src/components/directory/directory-header.tsx` | Dropped the now-false "profile pages are not published yet" sentence |
| `convex/schema.ts` | One field added — see section 5 |

---

## 5. Convex schema review

### Verdict: the Phase 1 model covers this page, with one gap closed

Checked against `documents/DATABASE.md` section 2 and the brief's section 13
checklist:

| Requirement | Representable today? |
|---|---|
| One professional offering multiple services | Yes — `professionalServices.by_professional` |
| Services associated with specific jurisdictions | Yes — `professionalServices` is a (service, jurisdiction) triplet |
| Multiple practice locations | Yes — `professionalLocations` + `isPrimary` |
| Multiple languages | Yes — `professionalLanguages` |
| Individual professionals and firms | Yes — `professionals.kind` + `firmName` |
| Credentials with separate verification status | Yes — `professionalPublicCredentials.publicDisplayStatus` + `reviewedAt` |
| Publication status and approval gate | Yes — `publicationStatus` + `approvedProfile` |
| Profile slugs | Yes — `professionals.slug` |
| Remote consultation support | Yes — `professionals.remoteServices` |
| **In-person consultation support** | **No — field added, see below** |

### Index review: no new index required

| Lookup | Existing index |
|---|---|
| Profile by slug | `professionals.by_slug` |
| Published profile filtering | `professionals.by_publication_status` |
| Professional → services | `professionalServices.by_professional` |
| Jurisdiction → professionals (related) | `professionalServices.by_jurisdiction_service` |
| Service + jurisdiction → professionals (related) | `professionalServices.by_service_jurisdiction` |
| Professional → locations / country+city | `professionalLocations.by_professional`, `by_country_city` |
| Professional → languages | `professionalLanguages.by_professional` |
| Professional → credentials | `professionalPublicCredentials.by_professional` |

Nothing was added, and no unrelated collection was touched.

### One applied change

```ts
// convex/schema.ts — professionals
inPersonServices: v.optional(v.boolean()),
```

**Why.** `remoteServices` alone cannot distinguish "remote only" from
"remote or in person", and a `professionalLocations` row is a statement
about geography, not an offer to meet clients there — inferring in-person
availability from a location would invent a consultation preference nobody
declared. Both the Day 3 directory's `?mode=in_person` filter and this
page's consultation section are already specified against that fact
(DESIGN.md section 6: "languages, location and remote indication"), and it
was simply missing from the professional record. This is the same kind of
omission the Day 4 `countries.seo` addition closed.

**Safety.** Optional, so no existing document becomes invalid and no
backfill is required. A profile that has never stated a position renders as
"not stated" — never as a guess.

### Gaps documented, not changed

| Gap | Decision |
|---|---|
| No timezone on `professionals` | Not added. Timezone belongs with scheduling (`availabilitySlots`, Phase 3). The page simply omits it. |
| No expiry/renewal on `professionalPublicCredentials` | Not added. `credentialSubmissions.expiryAt` is the approved Phase 2 home for it. The page shows no expiry. |
| No issuer data in practice | Field exists (`issuer`); no fixture supplies one, because inventing an issuing body would fabricate a certification. The UI renders it when present. |
| `professionals.featured` exists but the Day 2 highlights are hard-coded fixtures | Unchanged; wiring `by_featured` is a backend task. |

### Backend functions this page needs

```
professionals:getPublishedBySlug(slug)
  -> the ProfessionalProfile projection in src/lib/professionals/profile-types.ts
  -> must enforce approvedProfile === true AND publicationStatus === "published"
     server-side, and return NOT_FOUND (not a distinguishable error) otherwise
```

Plus, for the related strip, either a narrow
`professionals:listRelated(slug, limit)` or a reuse of
`professionals:search` filtered by the viewed profile's services and
jurisdictions.

---

## 6. Data sources

| Shown on the page | Source today | Source eventually |
|---|---|---|
| Identity, location, services, jurisdictions, languages, portraits | Day 3 `directoryFixtures`, projected by `buildProfile` | `professionals:getPublishedBySlug` |
| Biographies, extra locations, per-service jurisdiction mapping, service notes | `extrasBySlug` in `profile-fixtures.ts` | same query |
| Unpublished profiles (2) | `unpublishedProfiles` in the same lookup map | `publicationStatus` in Convex |
| Service titles/descriptions/icons | `serviceCatalog` (Day 4) | `services:getBySlug` |
| Jurisdiction and country labels | `@/lib/directory/taxonomy` | `jurisdictions:listByCountry`, `countries:listDiscoverable` |
| Related professionals | overlap scoring over `directoryFixtures` | `professionals:search` / `listRelated` |

**Nothing on this page reads Convex at runtime.** No `convex/professionals`
module exists yet and none was created.

Published fixtures are *derived from* the Day 3 directory rows rather than
written a second time, so a profile page can never show a professional the
directory would filter out, or disagree with the card the reader clicked.

### Why the two unpublished fixtures live in the same lookup map

They were first held in a separate array. The build tree-shook them away
entirely, which meant the "unpublished profile is blocked" test passed for
the wrong reason — the slug simply did not exist. They now sit in the same
`bySlug` index the public read uses, so `getPublishedProfile`'s
`approvedProfile` / `publicationStatus` gate is what actually rejects them.

---

## 7. Navigation

| From | To | Verified |
|---|---|---|
| Directory card "View Profile" | `/professionals/<slug>?from=<filters>` | yes |
| Homepage featured card | `/professionals/<slug>` | yes (4 cards) |
| Service page preview card | `/professionals/<slug>` | yes |
| Country page preview card | `/professionals/<slug>` | yes |
| Related-professionals card | `/professionals/<slug>?from=<filters>` | yes |
| Profile breadcrumb | `/` and `/find-accountant` | yes |
| Profile service card | `/services/<slug>` (Day 4) | yes |
| Profile location link | `/countries/<CODE>` (Day 4) | yes |
| Profile jurisdiction chip | `/find-accountant?jurisdiction=<CODE>` | yes |
| "Back to Search Results" | the directory with the arriving filters | yes |

### Filter preservation, and why `?from=` is safe

The directory serializes its committed filters once
(`toDirectorySearchParams`) and hands the string to every card.
The profile page never uses that value as a URL: it re-parses it through
`parseDirectoryFilters` — which drops unknown countries, cities,
jurisdictions, services and languages — and rebuilds the link against
`DIRECTORY_PATH`. The input is also length-capped at 512 characters.

Verified: `?from=https%3A%2F%2Fevil.example%2Fx%3Fcountry%3DZZ` produces a
back link of exactly `/find-accountant`, and the label drops its
"(filters kept)" suffix.

Canonical stays the bare `/professionals/<slug>`: `?from=` is a navigation
convenience, never a second address for the same page.

---

## 8. SEO and accessibility

- Dynamic title: `"<name> — <city>, <country> | TaxAccountant.com"`.
- Meta description built only from facts on the record (name, designations,
  primary location, listed service categories).
- Canonical `https://taxaccountant.com/professionals/<slug>`.
- `robots: noindex, follow` on every profile page, and on the not-found page.
- No structured data (neither `Person` nor `BreadcrumbList`) — the page is
  `noindex` and the facts are fixtures.
- Verified in the rendered DOM: exactly one `<h1>`, no skipped heading
  levels, 0 images without `alt`, 0 links without an accessible name, 0
  `role="img"` without a label, labelled landmarks (`nav[Breadcrumb]`,
  `nav[Profile sections]`, `main`, `aside`), all 9 in-page anchors resolve to
  a real target, and `:focus-visible` renders a 2.67px solid outline.

---

## 9. Testing performed

### Commands

| Command | Result |
|---|---|
| `npm run typecheck` | pass, no output |
| `npm run lint` | pass, no output |
| `npm run build` | pass; `/professionals/:slug` registered as a dynamic route |

### Route checks (dev server, `localhost:5173`)

| URL | Rendered |
|---|---|
| `/professionals/sarah-johnson` | full profile, bio, 3 services, 2 jurisdictions |
| `/professionals/amara-okafor` | About empty state, "Remote only", in-person "not offered" |
| `/professionals/northgate-tax-partners` | "Firm practice" chip, firm name, 2 locations |
| `/professionals/michael-chen` | per-service jurisdictions narrowed correctly (bookkeeping/payroll = Canada only; business tax = CA + US) |
| `/professionals/not-a-real-person` | not-found page |
| `/professionals/atlas-fiscal-group` (draft) | not-found page; no name, city or status in the HTML |
| `/professionals/helena-fischer` (suspended) | not-found page; no name, city or status in the HTML |
| `/` `/find-accountant` `/services/*` `/countries/*` | unchanged, all links resolve |

Grepped the rendered HTML of a profile for `years of experience`, `rating`,
`/hr`, `Available Today`, `Book Appointment`: every hit is inside copy
explaining the absence of that data. Unpublished slugs appear in neither the
client assets nor the prerendered output.

### Responsive (measured in a sized iframe, not eyeballed)

| Width | Horizontal scroll | Overflowing elements | Layout |
|---|---|---|---|
| 375 | none | 0 | single column, aside below content, mobile bar shown |
| 768 | none | 0 | single column, mobile bar hidden |
| 1024 | none | 0 | two columns, sticky aside alongside |
| 1440 | none | 0 | two columns, sticky aside alongside |

Portrait holds 4:5 (measured 0.801) at every width. Day 2–4 pages re-checked
at 375: no horizontal scroll and no regressions. (`/find-accountant` reports
11 "off-viewport" nodes at 375 — these are the closed mobile filter drawer,
intentionally translated off-canvas. Pre-existing Day 3 behavior.)

### Cloudflare

`cloudflare.config.ts`, `vite.config.ts`, `next.config.ts` and
`package.json` are untouched; the Workers preview (`npm run start`) serves
every route above.

---

## 10. Outstanding issues and dependencies

1. **`notFound()` responds HTTP 200.** The correct not-found UI renders, but
   the status line is 200 in both the dev server and the Workers preview.
   This is a **pre-existing vinext behavior, not a Day 5 regression** — Day
   4's `/services/does-not-exist` and `/countries/ZZ` behave identically,
   while a completely unmatched route (`/totally-unmatched-xyz`) correctly
   returns 404. Worth raising upstream; it matters for crawlers once these
   pages become indexable.
2. **`professionals:getPublishedBySlug` does not exist.** Everything on the
   page is a fixture. Publication filtering is enforced in the frontend read
   only and **must** be enforced server-side when the query lands.
3. **No contact workflow.** `contact:submit` and a contact route are
   unbuilt, so every profile shows the honest "no contact channel" state.
   `ContactProfessional` already branches on `publicContactMode` and expects
   `/contact?professional=<slug>`.
4. **Related professionals are matched client-side** over the full fixture
   array. At real scale this needs an indexed query, not an in-memory scan.
5. **Verification is Phase 2.** The verified branch of
   `CredentialsSection` is written and unreachable by design until a real
   review writes `reviewedAt`.
6. `professionals.featured` is still unused; the Day 2 highlights remain the
   hard-coded reference-design fixtures.

---

## 11. Day 5 acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Professional profile route implemented | PASS |
| 2 | Premium profile header designed | PASS |
| 3 | Professional photograph displayed | PASS (4 of 16 fixtures carry a rights-cleared portrait; the rest use the initials avatar rather than reusing a face) |
| 4 | Biography section implemented | PASS (6 of 16 have a bio; the rest render the empty state) |
| 5 | Services and specialties displayed | PASS |
| 6 | Tax jurisdictions and locations distinguished | PASS |
| 7 | Credentials section implemented | PASS |
| 8 | Accurate verification status displayed | PASS — badge requires status **and** `reviewedAt` |
| 9 | Language information displayed | PASS |
| 10 | Consultation preferences shown | PASS |
| 11 | Contact CTA implemented appropriately | PASS — honest unavailable state, no fake enquiry |
| 12 | Related professionals section implemented | PASS |
| 13 | Directory-to-profile navigation works | PASS |
| 14 | Homepage-to-profile navigation works | PASS |
| 15 | Service and country links work | PASS |
| 16 | Invalid slug handled | PASS for the rendered page; **see issue 1** for the HTTP status |
| 17 | Unpublished profile access blocked | PASS — blocked by the gate, no information leaked |
| 18 | Responsive layouts verified | PASS at 375 / 768 / 1024 / 1440 |
| 19 | SEO metadata implemented | PASS — title, description, canonical, `noindex` |
| 20 | Accessibility checked | PASS — see section 8 |
| 21 | Convex schema reviewed | PASS — one justified optional field added, no new index needed |
| 22 | Existing homepage, directory and service pages preserved | PASS |
| 23 | TypeScript checks pass | PASS |
| 24 | Lint passes | PASS |
| 25 | Production build passes | PASS |
| 26 | All changes remain on `feat/frontend` | PASS |

**Day 5 status: COMPLETE**, with issue 1 (framework-level 404 status) carried
forward as a pre-existing defect rather than a Day 5 regression.
