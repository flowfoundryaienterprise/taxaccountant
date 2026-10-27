# Day 8 — Technical SEO, Sitemap, Accessibility & Performance

**Branch:** `feat/frontend`
**Scope:** metadata, indexing, sitemap/robots, structured data, images,
fonts, accessibility, performance. No redesign, no backend services.

---

## 1. Route-level SEO audit (before any change)

| Route | Canonical | robots index | OG | JSON-LD |
|---|---|---|---|---|
| `/` | yes | inherits true | yes | **none** |
| `/find-accountant` | yes | false | yes | no |
| `/services` | yes | true | yes | yes |
| `/services/[slug]` | yes | true | yes | yes |
| `/countries` | yes | false | yes | no |
| `/countries/[countryCode]` | yes | false | yes | no |
| `/professionals/[slug]` | yes | false | yes | no |
| `/resources` | yes | true | **MISSING** | yes |
| `/resources/[slug]` | yes | true | yes | yes |
| `/for-professionals` | **MISSING** | **inherits true** | **MISSING** | no |
| `/sign-in` | **MISSING** | false | no | no |

Routes named in the brief that **do not exist**: `/about`, `/contact`,
`/how-it-works`. The first two are demonstration records in the CMS with no
public route; the third is a homepage anchor. None was created — the brief
says not to add public pages to fill the checklist.

### Defects found

1. **`/for-professionals` was indexable with no canonical and no OG.** An
   indexable page with no canonical is the most consequential item here.
2. `/sign-in` had no canonical.
3. `/resources` had no Open Graph metadata.
4. **No sitemap and no robots.txt existed at all.**
5. **No `Organization` or `WebSite` structured data** anywhere.
6. **The origin was hard-coded in four files** — `app/layout.tsx`,
   `shared/breadcrumbs.tsx`, `admin/seo-fields.tsx`,
   `admin/admin-fixtures.ts`. Four copies of the value that appears in every
   canonical tag.
7. **No skip-to-content link** — a WCAG 2.2 AA item DESIGN.md §10 lists
   explicitly.
8. **Duplicate `BreadcrumbList`** on service detail pages (found during
   verification, after my own change collided with an existing one).
9. **`FAQPage` structured data** on service pages (pre-existing, Day 4).

All nine are fixed. Details below.

---

## 2. The canonical host is an unconfirmed assumption

**This is the open item most worth reading.**

The brief says: "Implement canonical URLs only after confirming the
canonical host. Do not invent a deployment URL."

**No approved document states a production domain.** ARCHITECTURE.md §5 says
only "custom domain and HTTPS" without naming one. `https://taxaccountant.com`
was hard-coded on Day 1, matches the project name, and is carried forward —
replacing it with a different guess would be worse, and removing canonicals
entirely would be worse still.

What changed: it is now a single value in `src/lib/seo/site.ts`, overridable
by `NEXT_PUBLIC_SITE_ORIGIN`. Deploying to the real host — or to a staging
host that must not claim production canonicals — is now a configuration
change rather than an edit across four files.

**Confirm the production host before launch.** A canonical pointing at a
host the site is not served from is one of the few SEO mistakes that
actively removes a site from search results.

---

## 3. Sitemap and robots: the convention does not work here

`app/sitemap.ts` and `app/robots.ts` were written first, as the brief
suggests. **They do not work under vinext**: neither appears in the build
route manifest, and both paths returned the 404 page (measured).

They are served as **Route Handlers** instead — `app/sitemap.xml/route.ts`
and `app/robots.txt/route.ts` — which demonstrably work (`/api/health` has
shipped since Day 1). The sitemap's contents live in
`src/lib/seo/sitemap-entries.ts` so they can move to the convention
unchanged if vinext gains support.

### The sitemap reads the public repository, not the CMS

This was flagged at the end of Day 7 and is the trap this file exists to
avoid. Two sources disagree about "published":

- the **CMS** holds articles marked `published` — fictional fixtures;
- the **public repository** serves what a reader can reach — currently
  nothing.

Generating from the CMS would have listed URLs that 404 for every crawler
that followed them. The sitemap reads `publicContentRepository`, the same
source `/resources` renders from, so the two cannot disagree.

### Verified

| Check | Result |
|---|---|
| Every sitemap URL returns 200 | **11/11 PASS** |
| Every sitemap URL is `index, follow` | **11/11 PASS** |
| Every `noindex` route absent from sitemap | **7/7 PASS** |
| No fixture profile, country page or filtered URL listed | PASS |
| No fabricated `lastModified` | PASS — omitted where no real date exists |

Contents: `/`, `/services`, `/resources`, and the eight service detail
pages. No resource URLs, correctly — none is published.

### Filtered-search strategy

The directory takes nine filter parameters; multiplied out that is the
classic faceted-navigation trap. Two measures, doing different jobs:

1. every filtered URL **canonicalizes** to the bare `/find-accountant`
   (already true — the route sets a static canonical);
2. robots.txt **disallows** the query forms, so crawlers do not enumerate
   them in the first place.

Shareable filtered links are unaffected for human visitors, preserving the
Day 3 URL-as-state contract.

---

## 4. Structured data

Added: `Organization` + `WebSite` (homepage), `Service` (service detail),
`Article` (resource detail), and the existing `BreadcrumbList`.

**Removed**: a duplicate `BreadcrumbList` on service pages — my own addition
collided with the one `ServiceDetailHero` already emitted next to the
visible trail. Two of them is contradictory structured data, not twice the
signal. Also removed **`FAQPage`** (pre-existing from Day 4): the Q&A is
genuinely visible so the markup was not false, but the brief rules out
unsupported FAQ rich-result claims, and since 2023 FAQ rich results show
only for authoritative government and health sources.

### Deliberately not emitted

`AggregateRating`, `Review`, `Offer`, `PriceSpecification`, `PostalAddress`,
`hasCredential`, and `Person`/`ProfessionalService` for professionals —
every one would be a claim this project cannot support. The profiles are
fixtures describing people who do not exist, with credentials explicitly
marked unverified.

`SearchAction` is also omitted: it advertises a sitelinks search box
pointing at `/find-accountant?q=`, a `noindex` route backed by fixtures.

**Escaping:** `<`, `>` and `&` are escaped to unicode in the JSON-LD
payload. `JSON.stringify` does not escape `/`, so a `</script>` sequence in
an editor-supplied title would otherwise close the element early and the
remainder would parse as markup.

### Validated

Parsed from the rendered HTML of `/`, `/services/[slug]` and `/resources`:
all blocks are valid JSON, `@type` values are correct, and a scan for
fabricated-claim keys (`aggregateRating`, `ratingValue`, `reviewCount`,
`offers`, `price`, `hasCredential`, `telephone`, `streetAddress`,
`FAQPage`) returns **zero hits**.

---

## 5. Images and fonts

### Already correct — verified, not changed

- JPEGs are served through `/_next/image?url=…&w=640&q=75`, so the
  Cloudflare optimizer is working and sizing responsively.
- The homepage hero, service hero and country map carry `priority`;
  everything else lazy-loads by default.
- Fonts: one family (Inter), latin subset only, `display: swap`, variable
  weight — a single 47 KB woff2. Nothing to improve.
- **CLS measured 0** on the homepage, before and after.

### Changed

`public/_headers` adds a week of caching for `/images/*` and the favicons,
which previously had **no cache header at all** (only `/_next/static/*` did).
Verified applied: `cache-control: public, max-age=604800, must-revalidate`.

**A regression caught during this change:** the first version of
`public/_headers` **replaced** vinext's generated file rather than merging,
silently dropping the `/_next/static/*` immutable rule — which would have
cost more than the image caching gained. vinext's rule is now reproduced
verbatim in the file, and the build output was diffed against the original
to confirm additions only.

### Not fixed: `world-map.svg` is 594 KB

By far the largest asset (260 KB gzipped). Next.js does not optimize SVG, so
it is served raw. ~98% is path coordinate data — stripping the Inkscape
metadata saves only 8 KB, and reducing coordinate precision changes geometry,
which the brief's "preserve the visual appearance" rules out.

**Recommendation for a later day:** run SVGO with a controlled precision
setting and visually diff, or replace with a simplified projection. It
lazy-loads on the homepage (confirmed absent from the first-load set) but is
`priority` on country pages. I did not remove `priority` blind: without an
LCP measurement, that could make LCP worse rather than better.

---

## 6. Performance: measured, and honestly reported

### What was measured

| Metric | Homepage |
|---|---|
| CLS | **0** (before and after) |
| First-load JS | **647 KB across 19 chunks** |
| CSS | 57 KB |
| Font | 47 KB (1 file) |
| Images above the fold | 41 KB across 3 |

Measured on the production build via `PerformanceObserver` and Resource
Timing. The preview server applies no compression, so these are
uncompressed sizes; Cloudflare compresses in production.

### BLOCKED: LCP and INP

**LCP, FCP and INP could not be measured.** Paint and LCP entries return
empty in the browser-extension execution context, even though
`PerformanceObserver.supportedEntryTypes` lists them. Lighthouse is not
available here.

So the Core Web Vitals targets in the brief are **unverified**. No number is
reported for them, and none should be inferred from the sizes above.

### Did Day 8 make the site faster?

**Essentially no, and the report should not claim otherwise.** First-load
weight is unchanged apart from +2 KB of CSS for the skip link. The two
raw totals (759 KB before, 882 KB after) are **not comparable** — different
numbers of lazy images had loaded in each run, which is why the per-category
breakdown above is the figure to trust.

The one genuine performance change is image cache headers, which affect
repeat visits and cannot be measured in a single-load test.

**The real finding is that JS dominates at 647 KB across 19 chunks.**
Reducing it means revisiting client-component boundaries and the RSC
payload — architectural work that exceeds "do not redesign the website" and
would risk regressions across six finished screens. Recorded for Day 9+.

---

## 7. Accessibility

### Fixed

**Skip-to-content link added** — WCAG 2.2 AA, and DESIGN.md §10 lists it.
Without one, a keyboard user tabbed through the brand, seven nav items with
dropdowns, locale selectors and two buttons on every page before reaching
content. It is now the first element in `<body>`, visually hidden until
focused, targeting `<main id="main-content">`. Added to both the public
chrome and the CMS shell.

### Verified across `/`, `/find-accountant`, `/services/[slug]`,
`/countries/US`, `/professionals/[slug]`, `/resources` at 375 / 1024 / 1440

| Check | Result |
|---|---|
| Exactly one `<h1>` in the DOM | PASS, all routes |
| Links with no accessible name | 0 |
| Buttons with no accessible name | 0 |
| Images with no `alt` | 0 |
| Page-level horizontal scroll | none |
| Skip link present and first | PASS |

**A false positive worth recording:** static HTML for `/find-accountant`
contains three `<h1>` tags, which looks like a defect. The DOM has exactly
one — the extras are the `loading.tsx` streaming fallback left in the
response stream. Measuring the DOM rather than the HTML string is what
distinguished them; no change was needed.

The 11 "overflowing" nodes on `/find-accountant` at 375px are the closed
mobile filter drawer, intentionally translated off-canvas. Pre-existing and
correct.

---

## 8. Security and privacy

| Check | Result |
|---|---|
| `/admin` in production build | **404** |
| CMS strings in production output | 0 across 5 markers |
| Unapproved professional fixtures in output | 0 |
| Secrets in served assets | 0 (`CONVEX_DEPLOYMENT`, `AUTH_SECRET`, `R2_`, `CLOUDFLARE_API`) |
| Private fields in public page metadata | none |
| Draft content reachable publicly | no — public repository returns nothing |

Robots rules are documented in the file itself as **not** an access control:
the CMS is excluded at build time, and drafts are excluded by the data
layer, not by asking crawlers politely.

---

## 9. International SEO — prepared, not implemented

No `hreflang` was added. There is exactly one locale (`en`), no translated
page exists, and `hreflang` pointing at locale variants that do not exist is
worse than none.

Documented for later: country routes are already uppercase ISO 3166-1
alpha-2 with a canonical form (`/countries/US`); tax jurisdiction codes are
a separate namespace from country codes and must stay that way; and country
records must not be indexed merely because they exist — `discoverable` and
the three activation flags are independent, as Day 6 established.

---

## 10. Files

**Created:** `src/lib/seo/site.ts`, `indexing.ts`, `structured-data.ts`,
`sitemap-entries.ts`; `src/components/seo/json-ld.tsx`;
`src/components/layout/skip-link.tsx`; `src/app/robots.txt/route.ts`;
`src/app/sitemap.xml/route.ts`; `public/_headers`;
`docs/DAY8_SEO_PERFORMANCE.md`.

**Modified:** `src/app/layout.tsx`, `page.tsx`, `for-professionals/page.tsx`,
`sign-in/page.tsx`, `resources/page.tsx`, `services/[slug]/page.tsx`;
`src/components/layout/site-chrome.tsx`, `src/components/admin/admin-shell.tsx`,
`src/components/shared/breadcrumbs.tsx`,
`src/components/shared/faq-accordion.tsx`.

No Convex schema change was needed: the SEO fields these routes consume
(`seo.title`, `seo.description`, `seo.canonicalPath`, `seo.ogImagePath`,
publication status, `reviewedAt`, `publishedAt`) all exist already, the last
two added on Day 7.

---

## 11. Day 8 acceptance checklist

| Item | Status |
|---|---|
| SEO audit completed | PASS |
| Homepage metadata reviewed | PASS |
| Directory metadata implemented | PASS |
| Service metadata implemented | PASS |
| Country metadata implemented | PASS |
| Professional profile metadata implemented | PASS |
| Article metadata reviewed | PASS |
| Canonical URL strategy implemented | PASS — host unconfirmed, see §2 |
| XML sitemap implemented | PASS — as a Route Handler, see §3 |
| Robots configuration reviewed | PASS |
| Draft/private content excluded from indexing | PASS |
| JSON-LD implemented where appropriate | PASS |
| No fabricated structured data | PASS — scanned, 0 hits |
| Images optimized | PASS — already optimized; cache headers added |
| Fonts reviewed | PASS — already optimal, unchanged |
| Core Web Vitals baseline measured | **PARTIAL** — CLS 0 and transfer measured; **LCP/INP BLOCKED** |
| Performance improvements applied | PARTIAL — caching only; see §6 |
| Accessibility audit completed | PASS |
| Mobile usability checked | PASS at 375 / 1024 / 1440 |
| Broken links corrected | PASS — none found |
| Existing public functionality preserved | PASS |
| No private data exposed | PASS |
| Cloudflare/vinext compatibility preserved | PASS — `_headers` diffed, additions only |
| TypeScript checks pass | PASS |
| Lint passes | PASS |
| Production build passes | PASS |
| Changes remain on `feat/frontend` | PASS |

**Day 8 status: COMPLETE**, with LCP/INP measurement BLOCKED by tooling and
the canonical host flagged as unconfirmed.

---

## 12. Day 9 preparation — known issues

1. **Canonical host unconfirmed** (§2). Blocks launch, not Day 9.
2. **LCP/INP never measured.** Needs Lighthouse or a real-device run.
3. **JS is 647 KB across 19 chunks** — the dominant performance cost.
4. **`world-map.svg` is 594 KB** and `priority` on country pages.
5. **Most public routes are `noindex`** because they render Day 3-5
   fixtures. They cannot be flipped until real data replaces the fixtures —
   doing so would publish invented professionals and coverage.
6. **No Convex content query exists** (Day 7 finding, unchanged). The
   sitemap, `/resources` and the CMS all still read adapters.
7. **No authentication.** The CMS build gate remains one environment
   variable deep.
8. `/about`, `/contact`, `/how-it-works` exist as CMS demonstration records
   with no public route; `/contact` is blocked on `contact:submit`.
