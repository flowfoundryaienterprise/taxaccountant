# Day 4 — Country & Service Pages, Navigation Integration

Status notes for Phase 1 / Day 4. Source of truth for scope and rules:
`documents/PRD.md`, `documents/DESIGN.md`, `documents/ARCHITECTURE.md`,
`documents/DATABASE.md`, `documents/API.md`, `documents/AGENTS.md`.
Previous day: `docs/DAY3_DIRECTORY.md`.

## 1. What shipped

Four new routes, plus navigation integration across the existing site.

| Route | Kind | Indexable | Notes |
|---|---|---|---|
| `/services` | static | **yes** | Service discovery index, 8 categories |
| `/services/[slug]` | 8 pre-rendered params | **yes** | Reusable service detail template |
| `/countries` | static | no (see §6) | Country discovery index + search |
| `/countries/[countryCode]` | 8 pre-rendered params | no (see §6) | Reusable country detail template |

Supporting states: `services/loading.tsx`, `services/error.tsx`,
`services/[slug]/not-found.tsx`, `countries/loading.tsx`,
`countries/error.tsx`, `countries/[countryCode]/not-found.tsx`, and a new
site-wide `app/not-found.tsx`.

### Scheduling note

`documents/IMPLEMENTATION_PLAN.md` places `/services/*` on day 11 and
`/countries/*` on day 12. The Day 4 brief asked for both now. The brief was
followed; the plan rows for days 11-12 should be re-scoped to "CMS-backed
content + backend routing" rather than "build the layouts", since the
layouts now exist.

## 2. Screens

### `/services`

Hero (H1 "Tax & Accounting Services for Every Need", breadcrumbs, Find an
Accountant CTA, accounting photograph) → 8 category cards → *How to choose
the right service* → *Individual versus business services* → *International
and cross-border considerations* → *How discovery works on
TaxAccountant.com* → FAQs → closing CTA.

### `/services/[slug]`

Hero (title, overview, audience chip, relevant image, breadcrumbs, **Find
specialists** CTA) → *About the service* (what it covers / who may benefit /
**jurisdiction limits**) → *Common needs* (situations + questions worth
asking) → *Find professionals* → FAQs → related services → closing CTA.

The eight slugs are the ones that already existed — **unchanged**, so every
Day 2/Day 3 `?service=` link and bookmark still resolves:

```
/services/individual-tax-preparation
/services/business-tax-services
/services/bookkeeping-accounting
/services/payroll-services
/services/tax-planning-advisory
/services/international-tax-services
/services/irs-tax-audit-support
/services/amended-tax-returns
```

One **display title** changed: `irs-tax-audit-support` now reads
"Tax Audit Support" instead of "IRS / Tax Audit Support". The Day 4 brief
names the category that way, and an IRS-specific label on a marketplace that
claims to span jurisdictions is the kind of unsupported claim the brief
forbids. One string in `src/lib/home-content.ts`; the slug is untouched and
`serviceLabel()` picks the change up everywhere. Revert that one line if the
original wording was approved.

### `/countries`

Hero (H1 "Find Tax Accountants Around the World", world map with a marker
per discoverable country, Find an Accountant CTA) → country search →
region-grouped country cards → *Country, jurisdiction, location and
authorization* explainer → closing CTA.

Search is **case-insensitive across country name, short name, ISO code and
region**, has a clear button (and Escape-to-clear), an `aria-live` result
count, and an honest empty state. It is deliberately **not** in the URL —
unlike the directory, this is local narrowing of a short, fully-rendered
list, so a server round-trip per keystroke would buy nothing.

### `/countries/[countryCode]`

Country header (name, ISO tile, locator map, context, locale/currency,
breadcrumbs) → *Services represented in …* → *Tax jurisdictions* → *Find
accountants* → country FAQs → *Guides and resources* → closing CTA.

Routes are canonically **uppercase** (`/countries/US`). Lowercase resolves,
and its canonical tag points at the uppercase form, so there is one
indexable address per country rather than two.

Three distinct outcomes, all honest:

| Input | Result |
|---|---|
| discoverable country (`US CA GB DE IN SG AU AE`) | full page |
| known but not discoverable (`FR`, `JP`) | "not open for discovery yet" — no jurisdictions, no services, no professionals |
| unknown code (`ZZ`, `/countries/xyz`) | `notFound()` → country not-found page |

`FR` and `JP` exist in the catalogue **on purpose**: the unavailable path is
exercised code, not an untested branch, and a guessed URL gets a real answer
instead of a fabricated country listing. Neither appears in any listing, nav
menu, or map marker.

## 3. Truthfulness rules applied

The brief's content restrictions were treated as hard constraints, and in
several places the data model enforces them rather than the copy:

- **No professional counts anywhere.** `CountryCardData` has no count field
  at all, so no country card can render an "N experts" figure. The Day 2
  homepage map labels (`2,500+ Experts` etc.) are untouched replica content
  and were not copied onto these pages.
- **Country service coverage is derived, not asserted.**
  `servicesForCountry()` reads the Day 3 fixtures and returns only the
  categories actually present for that country — India shows 5 of 8, not 8.
  A country with none gets an empty state.
- **Jurisdictions are tax authorities, not authorization claims.** Each
  country page states the four concepts separately (professional location /
  customer location / tax jurisdiction / professional authorization), and
  each jurisdiction row links to `?jurisdiction=` **only** — never combined
  with `?country=`, because filtering by a jurisdiction must not silently
  also filter by where professionals are based.
- **No prices, rates, thresholds, deadlines or regulatory claims** appear in
  `src/lib/marketplace/services.ts` or `countries.ts`. Several FAQs
  explicitly say the platform does not publish them.
- **No advice.** "Questions worth asking" are questions; the pages never
  answer them for a reader's situation, and the advisory service page says
  so outright.
- **Every service page carries a jurisdiction-limits block.** The universal
  limitation is appended by `ServiceBenefits`, so no individual service
  entry can omit it.
- **Professional previews reuse the directory's own projection**
  (`toCardModel`) and `cta="pending"`, so nothing appears there that the
  directory would not show — including the continued absence of ratings,
  prices and availability — and no card links to the unbuilt
  `/professionals/[slug]`. The "development preview — N example profiles"
  notice is part of the component, not optional decoration.
- **No resources were invented.** `resourcesForCountry()` returns `[]` and
  the section renders an empty state, because no country guide has been
  written or reviewed.

## 4. Components

### Created

```
src/components/shared/breadcrumbs.tsx          reusable trail + optional BreadcrumbList JSON-LD
src/components/shared/empty-state.tsx          shared "nothing here yet" block
src/components/shared/faq-accordion.tsx        native <details>/<summary>, optional FAQPage JSON-LD
src/components/shared/marketplace-cta.tsx      closing CTA shared by service + country pages
src/components/shared/professional-preview.tsx short professional preview + honest empty state
src/components/layout/nav-link.tsx             primary nav item with active-page indication
src/components/services/services-hero.tsx
src/components/services/service-grid.tsx
src/components/services/services-guidance.tsx  ChoosingGuide, AudienceSplit, CrossBorderNote, DiscoverySteps
src/components/services/service-detail-hero.tsx
src/components/services/service-benefits.tsx
src/components/services/service-needs.tsx
src/components/services/service-faq.tsx
src/components/countries/countries-hero.tsx
src/components/countries/country-badge.tsx
src/components/countries/country-card.tsx
src/components/countries/country-search.tsx    the only new client component
src/components/countries/country-services.tsx
src/components/countries/country-jurisdictions.tsx
src/components/countries/country-overview.tsx
src/components/countries/country-unavailable.tsx
src/lib/marketplace/services.ts                editorial content, joined to home-content slugs
src/lib/marketplace/countries.ts               country catalogue + derivations
src/lib/marketplace/query-params.ts            directoryHref / serviceHref / countryHref
src/lib/directory/card-model.ts                toCardModel, extracted for reuse
```

### Reused unchanged

`Container`, `SectionHeading`, `Reveal`, `ProfessionalCard`, `PortraitImage`,
`AvatarInitials`, `buttonVariants`, `ScrollHeader`, `LocaleSelectors`, the
Day 3 filter/query-param modules, and `public/images/world-map.svg`.

### Modified

| File | Change |
|---|---|
| `shared/service-card.tsx` | optional `href`/`ctaLabel`; default destination is now `/services/[slug]` |
| `directory/professional-results.tsx` | imports `toCardModel` instead of defining it |
| `home/global-coverage.tsx` | "Explore by Country" → `/countries` |
| `layout/site-header.tsx` | Countries menu, Services → detail pages, active state, breakpoint (§7) |
| `layout/nav-dropdown.tsx` | `activePrefix`, `featured` item support |
| `layout/mobile-navigation.tsx` | active-page indication, `featured` support, `xl` breakpoint |
| `layout/site-footer.tsx` | Services/Countries in Quick Links; service links → detail pages |
| `lib/home-content.ts` | one service title (see §2) |
| `convex/schema.ts` | `countries.seo` (see §5) |

No component was duplicated, and no second design system was introduced.

### One deliberate design decision: `CountryBadge`, not a flag

Flags are rendered as an ISO-code tile rather than a flag emoji or image.
Regional-indicator emoji render as bare letter pairs on Windows, and
`public/images/ATTRIBUTIONS.md` lists every asset this project ships — no
licensed, attributed flag set is among them. The tile renders identically
everywhere, can never be a broken image, and still carries real information.
`CountryBadge` is the single place to swap in a licensed flag set later; call
sites and layout do not change.

## 5. Convex schema review

Reviewed `convex/schema.ts` against all four screens and the directory
filters.

### Verdict: the Phase 1 model covers these pages

| Need | Covered by |
|---|---|
| Country listing + activation gating | `countries.discoverable`, `countries.status`, `by_discoverable_status` |
| Country route param | `countries.code` + `by_code` |
| Country locale/currency display | `countries.defaultLocale`, `displayCurrency` |
| Tax jurisdictions per country | `taxJurisdictions` + `by_country`, with `active` |
| Jurisdiction / location separation | `professionalServices.taxJurisdictionId` vs `professionalLocations.countryId` |
| Service listing + slugs | `serviceCategories.slug`, `publicationStatus`, `by_slug`, `by_publication_status` |
| Service SEO | `serviceCategories.seo` |
| Service long-form content + FAQs | `contentPages` (`kind`, `serviceId`, `countryId`, `locale`, `seo`, `status`) |
| Country guides / resources | `contentPages.by_country_kind` |
| Professional ↔ service relationship | `professionalServices.by_service_jurisdiction` |

### One applied change

```diff
   countries: defineTable({
     ...
+    seo: v.optional(seoFields),
     updatedAt: v.number(),
   })
```

**Justification.** `/countries/[countryCode]` needs a per-country title,
meta description and canonical path. `serviceCategories` and `contentPages`
already carry `seo` for exactly this; the country side of the same
requirement was simply missing. Marked `v.optional(...)` so **no existing
document becomes invalid and no backfill is needed** — a country without
`seo` falls back to the generated defaults the page already produces.
No collection was added, no field renamed, no index changed, and no
authentication-owned collection touched. Not yet pushed to a deployment.

### Gaps documented, not changed

1. **`countries` has no region/continent field.** The region grouping on
   `/countries` is a presentation-only fixture. If curators are to control
   grouping, a `region` enum belongs on the record; if not, it should stay in
   the frontend. Needs a product decision before it is added.
2. **`serviceCategories` has no compound index on `(publicationStatus,
   sortOrder)`.** `services:listPublished` would sort in memory. With a
   couple of dozen categories that is fine, and adding an index for a query
   that does not exist yet would be speculative. Revisit when the query is
   written.
3. **`taxJurisdictions` has no `(countryId, active)` compound index.** Same
   reasoning: jurisdictions per country are few, so `by_country` plus an
   in-memory `active` filter is adequate until `jurisdictions:listByCountry`
   exists and is measured.
4. **No asset reference for country flags.** If a licensed flag set is
   adopted, it should be a `mediaAssets` reference on the country record
   rather than a hard-coded frontend path.
5. Every observation in `docs/DAY3_DIRECTORY.md` §3 still stands — in
   particular the absent keyword-search index and the
   offset-vs-cursor pagination mismatch. Nothing in Day 4 resolves or
   worsens them.

### Backend functions these pages need

None were implemented (explicitly out of scope). When they land, the swap is
contained:

| Function | Replaces |
|---|---|
| `countries:listDiscoverable` | `countryCatalog` / `discoverableCountries` |
| `jurisdictions:listByCountry` | `jurisdictionsForCountry` |
| `services:listPublished` | `serviceCatalog` |
| `services:getBySlug` | `getService` |
| `professionals:search` | `filterProfessionals(directoryFixtures, …)` and `servicesForCountry` |
| `content:listPublishedResources` | `resourcesForCountry` (currently `[]`) |

## 6. SEO

- Unique `<title>` and meta description on every route; canonical on all four.
- `BreadcrumbList` and `FAQPage` JSON-LD on `/services` and
  `/services/[slug]` **only** — the country routes are `noindex`, where
  structured data would be noise.
- `/countries` and `/countries/[countryCode]` are `noindex, follow`
  **because their service coverage is derived from Day 3 development
  fixtures.** Flip to `index: true` when `countries:listDiscoverable` and
  `professionals:search` back them. `/services` and `/services/[slug]` are
  indexable: their content is reviewed editorial description of a category
  of work, containing no listings, prices or coverage claims.
- Only eight service pages and eight country pages are generated, from
  approved lists. No city, city×service or country×service page matrix was
  created — the brief's "avoid hundreds of thin pages" rule.
- `generateStaticParams` enumerates exactly the approved params; everything
  else falls through to a not-found or unavailable state.
- International SEO is prepared but not built: `countries.defaultLocale` is
  surfaced, and `contentPages.locale` already exists for per-locale content.
  **No `hreflang` and no locale-prefixed routes were added** — that is Phase
  5 and would be dishonest markup today.

## 7. Navigation

| Navigation | Destination | Status |
|---|---|---|
| Logo | `/` | works |
| Home | `/` | works |
| Find an Accountant | `/find-accountant` | works |
| Services | `/services` (+ 8 detail pages in the menu) | works |
| Countries | `/countries` (+ 8 country pages in the menu) | works |
| How It Works | `/#how-it-works` | anchor on an existing homepage section; `/how-it-works` is not a route |
| Resources | menu; `/resources` entries stay **disabled with a lock** | honest unavailable state |
| For Professionals | `/for-professionals` | works (Resources menu, mobile sheet, footer) |

Verified: **zero `href="#"` links** on `/`, `/services`,
`/services/[slug]`, `/countries`, `/countries/[countryCode]`,
`/find-accountant` and `/for-professionals`; every internal `href` emitted by
the new pages resolves.

### Header breakpoint change — fixing a pre-existing overflow

The desktop nav now appears from **`xl` (1280px)** instead of `lg` (1024px).

Measured: the container never exceeds **1216px** of inner width
(`max-w-[1280px]` minus `px-8`). The brand takes 218px and the account
cluster 290px, leaving **676px** for the nav. The six nav items measure
**652px**. At `lg` only **960px** of container exists, so the same row needed
~1130px — **the header already overflowed horizontally at 1024px before this
change**, which the Day 4 responsive checks forbid. A seventh item does not
fit at any width, so "For Professionals" lives in the Resources menu, the
mobile sheet and the footer instead.

Below `xl` the mobile sheet takes over. It lists **all 27 destinations**
(verified), so nothing is lost at 1024-1279 — it is reached through the menu
button rather than inline.

Also added: active-page indication (`aria-current="page"` plus a persistent
underline, reusing the existing hover underline rather than inventing a
second visual language) on both desktop and mobile nav, including the
dropdown triggers via `activePrefix`.

## 8. Data sources

| Surface | Source |
|---|---|
| Service slugs, titles, descriptions, icons | `src/lib/home-content.ts` (shared with Day 2/3) |
| Service long-form content and FAQs | `src/lib/marketplace/services.ts` — **reviewable fixture content**, destined for `contentPages` |
| Country catalogue and activation flags | `src/lib/marketplace/countries.ts` — **development fixture**, shaped like the `countries` collection |
| Tax jurisdictions | `src/lib/directory/taxonomy.ts` (Day 3 fixture) |
| Professionals and per-country service coverage | `src/lib/directory/fixtures.ts` (Day 3 development fixtures) |
| Country resources | none — empty by design |

**Nothing on these pages reads Convex.** `convex/` still contains only
`schema.ts` and `healthCheck.ts`.

## 9. Testing performed

### Commands

| Command | Result |
|---|---|
| `npm run typecheck` | **pass**, no output |
| `npm run lint` | **pass**, no errors (one `react-hooks/set-state-in-effect` error was found and fixed — a redundant close-on-navigate effect in the mobile sheet; each link already closes it from its own `onClick`) |
| `npm run build` | **pass** — all 9 routes emitted, `/countries/:countryCode` and `/services/:slug` as dynamic |
| `npm run dev` | running on `http://localhost:5173` |

### Route checks (dev server)

| # | Check | Result |
|---|---|---|
| 1 | `/services` loads | pass |
| 2 | All 8 service detail routes load | pass |
| 3 | Invalid slug `/services/bogus-slug` | pass — not-found page, `<title>Service not found>`, lists real categories. **Status is 200, not 404** — see §11 |
| 4 | `/countries` loads | pass |
| 5 | All 8 country detail routes load | pass |
| 6 | `/countries/FR` (not discoverable) | pass — "not open for discovery yet", no listings, `noindex` |
| 6b | `/countries/ZZ` (unknown) | pass — country not-found page |
| 6c | `/countries/us` (lowercase) | pass — renders, canonical → `/countries/US` |
| 6d | `/totally-missing-route` | pass — **real 404** with the new site-wide not-found |
| 7 | Homepage service cards → `/services/[slug]` | pass — all 8 verified in rendered HTML |
| 8 | Homepage "Explore by Country" → `/countries` | pass |
| 9 | `/find-accountant?country=IN&service=business-tax-services` | pass — India checked in the sidebar, service chip applied, 2 matching results |
| 10 | Header navigation | pass — no `#` links, every destination resolves |
| 11 | Mobile navigation at 375px | pass — sheet opens, all 27 links present, body scroll locked |
| 12 | Breadcrumbs | pass on all four routes, including both not-found pages |
| 13 | Day 2 homepage | pass — renders unchanged apart from the two intended link targets |
| 14 | Day 3 directory | pass — filters, chips, sidebar, results all behave as before |
| 15 | Content claims | reviewed; see §3 |
| 16 | Responsive | see below |

### Responsive

Horizontal-overflow check (`scrollWidth > clientWidth`) across `/`,
`/services`, all service detail pages, `/countries`, country detail pages,
both not-found states, the unavailable state, and the directory with and
without filters:

| Width | Result |
|---|---|
| 375px | **no overflow** on any route |
| 768px | **no overflow** on any route |
| 1024px | **no overflow** on any route |
| 1280px | **no overflow** (verified in the live window, including the header) |

Two overflow defects were found during this pass and fixed:

1. The header nav row (see §7).
2. `buttonVariants` sets `whitespace-nowrap`, so the long
   "See all … professionals" and "Find professionals in …" labels pushed
   service and country pages ~130px wide at 375px. Those three buttons now
   wrap and grow instead (`h-auto whitespace-normal py-3`).

**1440px was not measured directly** — this machine's display is 1280 CSS px
wide (1920 physical at 1.5 DPR) and Chrome would not resize beyond it. The
container caps at 1280px, so above that width the layout is identical plus
side margins, and 1280 is the tightest desktop case, which was verified.

### Accessibility

- Breadcrumbs: `<nav aria-label="Breadcrumb">` + ordered list +
  `aria-current="page"`; wraps rather than overflowing.
- FAQs: native `<details>`/`<summary>` — keyboard-operable, correct
  expanded state exposed, and findable by in-page search, with no custom ARIA
  to get wrong.
- Country search: labelled input, Escape clears, labelled clear button,
  `aria-live="polite"` result count.
- Active page conveyed by `aria-current` as well as colour.
- `CountryBadge` is `role="img"` with the country name in its accessible
  name, so it is not announced as two letters.
- Decorative icons are `aria-hidden`; every image has descriptive alt text.
- Loading skeletons carry `role="status"` with a screen-reader label.
- No console errors or hydration warnings observed.

## 10. Images

No new image files were added. Existing rights-cleared Pexels photographs
(`public/images/ATTRIBUTIONS.md`) were mapped to services by topical fit:

| Service | Image |
|---|---|
| Individual tax preparation, Tax audit support | `article-tax-documents.jpg` |
| Business tax services | `article-small-business.jpg` |
| Bookkeeping & accounting, Amended tax returns | `article-accountant-calculator.jpg` |
| Payroll services | `cta-professionals.jpg` |
| Tax planning & advisory | `hero-accountant.jpg` |
| International tax services | `article-international-globe.jpg` |
| `/services` hero | `article-accountant-calculator.jpg` |
| `/countries` hero, country locators | `world-map.svg` (public domain) |

Two files are each used on two service pages. That is a known cosmetic
compromise, not a licensing or correctness problem; distinct photography for
all eight is a content task. Every image has its own descriptive alt text,
hero images use `priority`, and everything else lazy-loads by default.

## 11. Outstanding issues and dependencies

1. **`notFound()` returns HTTP 200 under vinext.** Unmatched routes return a
   real 404, but `notFound()` thrown from inside a dynamic page renders the
   correct not-found UI with a 200 status — vinext 1.3.0 has the
   `isHTTPAccessFallbackError` helpers in its Next shims but does not
   propagate the status in its request pipeline. Mitigated for now by
   `robots: { index: false }` on those responses, so they are not indexed as
   soft 404s. **Framework limitation, not introduced here** — worth an
   upstream issue, and worth re-testing on each vinext upgrade.
2. **Country coverage is fixture-derived**, which is the only reason the
   country routes are `noindex`. The index flag and the fixture removal
   should land together.
3. **Reveal-on-scroll and no-JS** — the `/services` card grid reuses the Day 2
   `Reveal`, which starts at `opacity-0`. `/services` *is* indexable, so this
   matters more here than it did for the `noindex` directory: crawlers that
   execute JS are fine, but the cards are invisible with JS disabled. Worth
   revisiting (a CSS-only `@starting-style` or an animation that starts
   visible) before launch. Flagged, not changed, to avoid touching the Day 2
   component's behaviour.
4. **1440px not directly measured** — see §9.
5. **`countries.seo` has not been pushed to a deployment** and nothing reads
   it yet; it is schema-only until `countries:listDiscoverable` exists.
6. **Service title change** (§2) is a content decision worth confirming.
7. Not implemented, out of scope: dashboards of any kind, Better Auth,
   payments, booking, messaging, subscriptions, lead credits, sponsored
   listings, AI matching, and any backend query.

## 12. Day 4 acceptance criteria

| Criterion | Status |
|---|---|
| Services directory implemented | PASS |
| Service detail template implemented | PASS |
| Eight service categories represented | PASS |
| Countries directory implemented | PASS |
| Country detail template implemented | PASS |
| Tax jurisdiction distinguished from location | PASS |
| Homepage services navigation integrated | PASS |
| Homepage country navigation integrated | PASS |
| Directory country/service filters preserved | PASS |
| Shared header/footer navigation works | PASS |
| Breadcrumbs implemented | PASS |
| Invalid slugs handled | PASS (correct UI and metadata; HTTP status is 200 — §11.1) |
| Responsive layouts tested | PASS at 375/768/1024/1280; 1440 not measurable here (§9) |
| Required images and icons load | PASS |
| SEO metadata implemented | PASS |
| No fabricated marketplace coverage | PASS |
| Convex schema reviewed | PASS (one justified optional field added) |
| Day 2 and Day 3 features preserved | PASS |
| TypeScript checks pass | PASS |
| Lint passes | PASS |
| Production build passes | PASS |
| All changes on `feat/frontend` | PASS |
