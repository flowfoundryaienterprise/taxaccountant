# Day 9 — Public Marketplace QA, Functional Testing, Bug Fixes & Regression Testing

**Project:** TaxAccountant.com · Phase 1 — Public Marketplace & Foundation
**Branch:** `feat/frontend`
**Baseline commit tested:** `3daebd3` *feat: optimize marketplace SEO accessibility and performance*
**Date:** 2026-10-28

---

## 1. Testing environment

| | |
|---|---|
| OS | Windows 11 (26220) |
| Node | v24.11.1 |
| Package manager | npm (`npm ci` from the committed lockfile) |
| Framework | vinext on Vite 8.3.0, React 19.3.1, Tailwind v4 |
| Runtime | Cloudflare Workers (`@cloudflare/vite-plugin`, workerd) |
| Dev server | `npm run dev` → `localhost:5173` |
| Production build | `npm run build` → `npm run start` (vite preview / workerd) → `localhost:4173` |
| Browser | Chrome (via browser automation) — the only engine available in this environment |
| Data source | Development fixtures. There is still no `convex/professionals` module. |

**Measurement note.** Every number in this report was measured in this
session. Dev-server and production-preview figures are labelled separately
because they differ by an order of magnitude, and both were taken on
localhost with no network throttling — they are a floor, not a field
estimate. No Lighthouse run and no CrUX field data were available.

---

## 2. Git state

Verified before any change:

```
git status                → clean
git branch --show-current → feat/frontend
git rev-parse HEAD        == git rev-parse origin/feat/frontend
```

Local `feat/frontend` was already identical to `origin/feat/frontend`, so
`git pull --ff-only` was a no-op.

**Divergence from `main` (reported, not acted on).** `HEAD` is 8 commits
ahead of `origin/main` and 4 behind. The 4 behind are merge commits
(`Merge pull request #3…#6`) produced by merging this branch into `main`,
so the content is present on both sides and the histories differ only in
shape. This is the expected result of a PR-merge workflow. **No merge or
rebase was performed**, per the brief.

---

## 3. Initial health check — recorded before any fix

| Command | Result |
|---|---|
| `npm ci` | **PASS** (exit 0). Lockfile in sync; no dependency substitution needed. |
| `npm run typecheck` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |

Two things `npm ci` reported that are **not** build failures but are on the
record:

- `14 vulnerabilities (7 moderate, 7 high)` from `npm audit`. Not triaged in
  this task — dependency remediation is not a Day 9 frontend change and
  every direct dependency is pinned to `latest`, so an audit fix is a
  separate, reviewed decision.
- `workerd@1.20261019.1` has a `postinstall` script **not covered by the
  script allowlist**, so it did not run. The build and the Workers preview
  both work, so nothing is currently broken by it, but it means a clean
  checkout's install is not fully reproducible without that approval.

So: **the initial health check passed.** The defects in section 6 were all
found by testing behaviour, not by the build — which is the point of them.

---

## 4. Route coverage

23 URLs were swept for HTTP status on both the dev server and the production
build.

### Implemented and healthy

| Route | Status | Title | Robots |
|---|---|---|---|
| `/` | 200 | Find Tax Accountants Worldwide | `index, follow` |
| `/find-accountant` | 200 | Find a Tax Accountant | `noindex, follow` |
| `/services` | 200 | Tax & Accounting Services | `index, follow` |
| `/services/[slug]` | 200 | *(per service)* | `index, follow` |
| `/countries` | 200 | Find Tax Accountants by Country | `noindex, follow` |
| `/countries/[code]` | 200 | *(per country)* | `noindex, follow` |
| `/resources` | 200 | Guides & Resources | `index, follow` |
| `/professionals/[slug]` | 200 | *(per profile)* | `noindex, follow` |
| `/for-professionals` | 200 | For Professionals | `noindex, follow` |
| `/sign-in` | 200 | Sign In | `noindex, follow` |
| `/sitemap.xml` | 200 | — | — |
| `/robots.txt` | 200 | — | — |
| `/api/health` | 200 | — | — |

### NOT IMPLEMENTED — not regressions

`/about`, `/contact`, `/how-it-works`, `/faq`, `/help` all return 404. None
of them has ever existed in this repository, and **nothing links to them**:

- "How It Works" in the header and footer points at `/#how-it-works`, and
  that anchor exists (`id="how-it-works"` on the homepage section). The
  anchors `#professionals`, `#coverage` and `#articles` were checked the
  same way and all resolve.
- Footer items with no destination yet (Pricing, Contact, FAQ, Help Center,
  Live Chat, Terms, Professional Login) are rendered as **plain text, not
  links**, so there is no broken-link path to any of them.

This is the correct Phase 1 treatment and was left alone.

### CMS

`/admin` and all 10 sub-routes return **404 in both the dev server and the
production build** with `CMS_PREVIEW` unset. Reviewed under
`CMS_PREVIEW=enabled` on an isolated local instance only — see section 9.

---

## 5. Test execution summary

| Area | Executed | Passed | Failed → fixed | Blocked / not testable |
|---|---|---|---|---|
| Route availability | 23 | 23 | 0 | — |
| Directory search & filters | 19 | 19 | 0 | — |
| Pagination & sorting | 13 | 13 | 0 | — |
| URL sync / back-forward | 6 | 6 | 0 | — |
| Professional profiles | 8 | 7 | 1 (BUG-02) | — |
| Services & countries | 11 | 11 | 0 | — |
| Images & assets | 20 | 20 | 0 | — |
| SEO / sitemap / robots | 14 | 14 | 0 | — |
| Responsive (9 routes × 4 widths) | 22 | 22 | 0 | — |
| Accessibility | 21 | 13 | 6 (BUG-03/04/05/07/10) | 2 (BUG-08 brand, BUG-11 cosmetic) |
| CMS (isolated preview) | 12 | 12 | 0 | 1 (no auth — see 9) |
| Convex integration | 6 | 4 | 0 | 2 (no backend yet) |
| Performance | 7 | 6 | 1 (BUG-06) | — |
| **Total** | **182** | **170** | **9** | **5** |

Automated unit tests added this session: **48, all passing** (section 11).

---

## 6. Bugs identified

### BUG-01 — Every custom font-size class was silently deleted from the DOM · **HIGH** · FIXED

| | |
|---|---|
| Route/component | Global — `src/lib/utils.ts` (`cn`), every `cn()` caller |
| Severity | High (site-wide visual defect, zero signal) |

**Reproduction.** Load `/`, inspect the Sign In button. Source says
`text-compact`; the rendered `class` attribute does not contain it.

**Expected.** `buttonVariants()` base layer carries `text-compact`
(0.875rem); the variant layer carries only a colour.
**Actual.** Rendered class list:
`… rounded-input font-medium … text-navy hover:bg-tint h-9 px-3` — the font
size is gone, and the button inherits 1rem.

**Root cause.** `tailwind-merge` ships a static map of Tailwind's *default*
scales and cannot read the `@theme` block in `globals.css`. The project
defines seven custom sizes there (`--text-caption` … `--text-hero`). An
unrecognised `text-*` class falls back to the **text-colour** conflict
group, so `cn("text-compact", "text-navy")` looked like two colours and the
later one won. Measured directly: **42 of 42** size × brand-colour
combinations lost a class. Reverse order lost the *colour* instead.

**Blast radius (measured).** 26 `cn()` call sites across 20 files lost a
class outright, plus — not counted in that figure because the classes arrive
through a variable rather than a literal — **every `<Button>` and every
`buttonVariants()` link in the application**, and the directory pagination
control.

**Fix.** Registered the custom scales with `extendTailwindMerge` in
`src/lib/utils.ts`. One change, no component touched. Radii
(`rounded-input|card|panel`) were registered at the same time: they had the
inverse failure (two radii would *both* survive and let stylesheet order
decide). No call site passes two radii today, so that part changes no
current output — it closes the hole before something does.

**Verification.** Rendered `class` attribute now contains `text-compact` on
buttons and on pagination links, in dev **and in the production build**.
Scanner re-run against the project's real config: 26 → 0. The 16 sites still
reported are mutually-exclusive ternary branches (`active ? "text-action" :
"text-navy"`), which is correct behaviour, confirmed by reading each.
Covered by 7 regression tests in `src/lib/__tests__/class-merge.test.ts`.

---

### BUG-02 — Homepage published invented ratings, review counts, rates and availability for named people · **HIGH** · FIXED (partial — see OPEN-01)

| | |
|---|---|
| Route/component | `/` — `src/components/home/featured-professionals.tsx` |
| Severity | High (public data integrity, on the only indexable page of the three) |

**Reproduction.** Load `/`, scroll to "Top Tax Accountants Near You".

**Actual.** Four named individuals shown with a filled star and "4.9
(124 reviews)", "$99/hr", "● Available Today" — none of it backed by
anything. Section heading read *"Browse **verified** professionals based on
your location, services, **ratings**, and **availability**."*

**Why this is a defect and not approved content.** The same four records are
described differently on two other pages in the same build:

- `/find-accountant`: *"No ratings, reviews, prices or availability are
  shown, because none of that data exists yet."*
- `/professionals/sarah-johnson`: credentials are *"Not yet verified by the
  marketplace"* (`verificationStatus: "not_reviewed"` for every fixture).

The homepage is `index, follow` with sitemap priority 1.0, so it was the one
page asserting the invented values as fact under a real brand. The heading
copy was also false on its own terms: the directory offers **no** rating or
availability filter at all — `filter-panel.tsx` states that those attributes
have no approved data source.

**Fix (focused, no redesign).** Section 6 of the brief forbids redesigning
the homepage, and the values came in as an explicitly-requested replica of a
supplied reference design, so the fields were **not** removed. Instead:

1. corrected the heading copy to "Browse professionals by location, service
   and tax jurisdiction" — what the directory actually does; and
2. added a demonstration-data notice in the **same component pattern the
   directory already uses**, naming the ratings, review counts, rates and
   availability as placeholder values and linking to the directory.

**Verification.** Notice renders on `/` in the production build; cards,
layout, imagery and brand styling unchanged.

**Residual risk is recorded as OPEN-01** — labelling is weaker than not
publishing the numbers, and removing them is a product decision.

---

### BUG-03 — Closed mobile nav kept 27 links in the tab order under a permanent `aria-modal` · **HIGH** · FIXED

| | |
|---|---|
| Route/component | All routes — `src/components/layout/mobile-navigation.tsx` |
| Severity | High (WCAG 2.2 AA: 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2) |

**Reproduction.** Render any page at 375px with the menu closed and
enumerate focusable descendants of `[role="dialog"]`.

**Expected.** A closed sheet is unreachable.
**Actual (measured at 375px).** `focusable: 27`, `reachableWhenClosed: 27`,
`inert: false`, `aria-hidden: null`, `visibility: visible`. The sheet is
only translated off-screen with `pointer-events-none`, which hides it from
the mouse and from nobody else. `aria-modal="true"` was set **permanently**,
including while closed — which tells a screen reader the rest of the page is
unavailable.

There was also **no focus containment while open** (Tab walked straight out
of a declared modal into the page behind it) and **no focus restoration on
close** (Escape dropped focus to `<body>`).

**Fix.** `inert={!open}` on the panel — the one attribute that removes a
subtree from both the tab order and the accessibility tree (a bare
`aria-hidden` over focusable content is itself an ARIA violation). Plus a
Tab/Shift-Tab cycle while open, and focus return to the toggle on close.

**Verification (measured in-browser at 375px).**

| | before | after |
|---|---|---|
| tabbable when closed | 27 | **0** |
| browser honours inert (focus refused) | n/a | **yes** |
| focus moves into panel on open | yes | yes |
| Tab from last element wraps to first | no | **yes** ("Home") |
| Escape restores focus to toggle | no | **yes** |
| `aria-expanded` false→true, label Open→Close | yes | yes |
| `body` scroll lock set/released | yes | yes |

---

### BUG-04 — Filter checkbox groups had no accessible name; "Singapore" was ambiguous · **MEDIUM** · FIXED

| | |
|---|---|
| Route/component | `/find-accountant` — `src/components/directory/filter-panel.tsx` |
| Severity | Medium (WCAG 2.2 AA: 1.3.1 Info and Relationships) |

**Reproduction.** Tab between the 57 filter checkboxes with a screen reader.

**Actual.** Six groups (`country`, `city`, `jurisdiction`, `service`,
`language`, `credential`) were bare checkbox lists inside a
`<details>`/`<summary>` disclosure, with no `fieldset` and no
`role="group"`. Only "Consultation mode" was grouped. Each checkbox
announced just its own label.

**Why it matters here specifically.** `"Singapore"` is an option in **both**
the Country group and the City group of the current data — measured, not
hypothetical. Tabbing, the two are indistinguishable. Keeping country, city
and tax jurisdiction distinct is a stated correctness requirement of this
directory, so the grouping has to be conveyed, not merely drawn.

**Fix.** `role="group"` + `aria-labelledby` pointing at the summary text
(`React.useId`). A `<fieldset>`/`<legend>` would need the legend as the
fieldset's first child, which this disclosure layout cannot give without
restructuring the section.

**Verification.** 7 groups, **0 unnamed**: Country, City, Tax jurisdiction,
Service, Language, Consultation, Professional designation. Confirmed in the
production build.

---

### BUG-05 — Dead "Save" control on homepage cards announced itself to screen readers · **MEDIUM** · FIXED

| | |
|---|---|
| Route/component | `/` — `src/components/shared/professional-card.tsx` |

**Actual.** A heart button with `aria-label="Save {name}"` and **no
`onClick`**. Clicking did nothing; keyboard and screen-reader users got a
focusable control announcing an action that does not exist. DESIGN.md rules
this out explicitly ("future-phase features must display honest availability
information instead of pretending to work").

**Root cause.** `saveable` defaulted to `true`. The directory, the
related-professionals rail and the profile preview each passed `false`
**explicitly** — the homepage simply never passed the prop, so it was the
only surface that ever rendered the control. The project had already decided
this; the default leaked it.

**Fix.** Default `saveable` to `false`, so the decided-safe value is the
default. No call site needed changing. Opt in when favourites exist.

---

### BUG-06 — `world-map.svg` was the largest asset on the site at 594.6 KB · **MEDIUM** · FIXED

| | |
|---|---|
| Route/component | `/` — `public/images/world-map.svg` |

**Measured.** 594.6 KB — larger than any JavaScript chunk (largest: 214.1 KB)
and ~10× the CSS bundle. 98% of the file (594.7 KB of 608.9 KB raw) was path
data, carried at five decimal places by the Inkscape export it came from
(55,594 numbers with ≥4 decimals), plus editor metadata.

It is `loading="lazy"` and below the fold, so it does **not** affect LCP or
the 315 KB initial load — but it is 43% of the homepage's fully-scrolled
weight.

**Fix.** Rounded coordinates to 2 decimals and dropped `<metadata>`,
`sodipodi:namedview` and `inkscape:*`. No library added. **594.6 KB → 404.0
KB (−190.6 KB, −32%)**.

**Verification — pixel equality, not assumed.** The `viewBox` is
`0 0 800 400`, so 0.01 of a user unit is well under a thousandth of a pixel
at any size this renders. Rasterised before/after at 1600×800 (twice the
natural size) and compared per channel:

```
pixels differing at all : 0 / 1,280,000  (0.000%)
max channel delta       : 0/255
```

The `<style>` block and the `.sea`/`.land` brand colours are intact; 168
paths and the `viewBox` unchanged; still valid XML. `ATTRIBUTIONS.md` said
"no path geometry changed", which is no longer true — it has been corrected
rather than left to drift.

---

### BUG-07 — `--color-action` failed WCAG AA for normal text · **MEDIUM** · FIXED

| | |
|---|---|
| Scope | Every primary button label, every action-coloured link and eyebrow |

Measured contrast for `--color-action: #0879e9`:

| Pair | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---|---|---|
| action on white (link, eyebrow text) | **4.27** | **FAIL** | PASS |
| white on action (**every primary button label**) | **4.27** | **FAIL** | PASS |
| action on tint (link on tinted panels) | **3.86** | **FAIL** | PASS |

Button labels render at `text-compact` (14px), which is "normal" text under
WCAG, so 4.5:1 is required. Everything else in the palette passes: navy on
white 13.82, slate on white 6.39, slate on tint 5.78, success 5.41, danger
6.57, warning 4.87, focus ring 6.72.

**Fix (authorised by the product owner after the first pass).** The token
was darkened along the same hue to **`#076ed4`**. Measured after:

| Pair | Before | After | AA normal |
|---|---|---|---|
| action on white | 4.27 | **5.01** | PASS |
| white on action (button labels) | 4.27 | **5.01** | PASS |
| action on tint | 3.86 | **4.54** | PASS |
| white on the `#0668c7` hover shade | — | **5.51** | PASS |

The hover shade was checked rather than assumed: it is still darker than the
new base (luminance 0.1406 vs 0.1595), so the button does not light up on
hover. The palette already contained `--color-focus: #1459b5` at 6.72:1, so
a darker blue was evidently already acceptable to the brand.

**Two related things were cleaned up at the same time.** Two checkboxes in
`filter-panel.tsx` hard-coded `accent-[#0879e9]` instead of using the token,
and six decorative glow shadows carried the old colour as a raw
`rgba(8,121,233,…)` triple. Both now follow the token — the checkboxes via
`accent-action`, which was verified to compile to
`accent-color:var(--color-action)`. The served production CSS now contains
**zero** occurrences of the old hex or its RGB triple.

**The brand mark was deliberately left at `#0879E9`.** WCAG 1.4.3 exempts a
logotype from contrast requirements, so the tile in `brand-logo.tsx`,
`public/favicon.svg` and `scripts/generate-icons.mjs` keeps the original
brand value rather than being changed as a side effect of an accessibility
fix — re-uniting them would also mean regenerating committed icon binaries.
The divergence is (1, 11, 21) of 255 and is not visible in the header where
the two sit side by side. Both files now say so, so it reads as a decision
rather than drift. Raise it if the brand wants them re-united.

---

### BUG-08 — Form control borders fail WCAG 1.4.11 · **LOW** · NOT FIXED (same token decision)

`--color-border: #d8e1eb` against white is **1.32:1**; WCAG 2.2 AA 1.4.11
requires **3:1** for the visual boundary of a UI component. The search
bar's text input and its two selects rely on `border-border` as their only
boundary. `globals.css` already marks this a "derived token pending
brand/contrast sign-off", so it is flagged there rather than changed here.

---

### BUG-10 — An unlayered `a { color: inherit }` overrode the text colour of 38 of 63 anchors · **HIGH** · FIXED

| | |
|---|---|
| Route/component | Global — `src/app/globals.css` |
| Severity | High (site-wide; produced a 2.76:1 contrast failure on every primary button) |

Found while verifying BUG-07, by checking what the browser actually
*rendered* rather than what the token was set to.

**Reproduction.** Load `/`, read the computed `color` of the Sign Up link.

**Expected** `rgb(255,255,255)` — it carries `text-white` via
`buttonVariants`. **Actual** `rgb(16,44,87)`, navy. Measured across the
homepage: **38 of the 63 anchors carrying a text-colour utility rendered the
wrong colour**, including every nav link, every action-coloured link, and
every primary button rendered as a `<Link>`.

**Root cause.** Tailwind v4 emits its output as `@layer theme, base,
components, utilities`. CSS cascade layers rank **unlayered** declarations
above every layered one, *regardless of specificity*. `globals.css` declared
`a { color: inherit }` at the top level, so it outranked `.text-white` in
`@layer utilities` — even though the class is more specific. Tailwind's own
preflight sets the identical rule, but inside `@layer base`, where a utility
correctly overrides it.

This is the hardest class of bug to see: the class was in the DOM, the rule
was in the stylesheet, the type checker and the build were happy, and the
cascade discarded it silently.

**Why it mattered more than cosmetics.** Primary buttons rendered a navy
label on the action-blue fill: **2.76:1**, far below AA. Darkening the token
for BUG-07 made the *rendered* figure worse, not better (3.24 → 2.76),
because the label was never white to begin with. Fixing BUG-07 alone would
have been counterproductive.

**Fix.** Moved `:root`, `body`, `a` and `:focus-visible` into `@layer base`,
which is where element defaults belong and is exactly what Tailwind's
preflight does. The `prefers-reduced-motion` override stays unlayered and
`!important` on purpose — that one *must* outrank utilities.

**Verification.** Anchors rendering the wrong colour: **38 → 0**. Sign Up is
`rgb(255,255,255)` on `rgb(7,110,212)` = **5.01:1**, at 14px. Confirmed
visually at high zoom, and in the production build. Guarded by 3 tests in
`src/lib/__tests__/globals-layers.test.ts`, which were checked to fail when
the rule is moved back out.

---

### BUG-11 — The focus ring renders `currentColor`, not `--color-focus` · **LOW** · NOT FIXED (pre-existing, cosmetic)

`globals.css` declares `:focus-visible { outline: 2px solid
var(--color-focus) }` (`#1459b5`). The rule reaches the served CSS intact
and its width and offset apply, but the **colour** resolves to
`currentColor` — navy on most surfaces — so focus rings are navy rather than
the intended focus blue.

**Confirmed pre-existing, not caused by BUG-10's fix.** Measured on a build
of the committed baseline and on the fixed build: byte-identical results
(`2px solid rgb(16,44,87) offset 2px` on a nav link; the Chrome UA ring
`2.66667px solid … offset 0` on an element the rule does not reach).

**Low severity, deliberately.** Navy on white is **13.82:1**, so the focus
indicator is *more* visible than the intended `#1459b5` (6.72:1) — WCAG
2.4.7 and 1.4.11 are satisfied either way. What is wrong is the hue, not the
visibility. Root cause not isolated; it is below the Day 9 bar and would be
a speculative change to chase now. Recorded for Day 10.

---

### BUG-09 — Invalid slugs return HTTP 200 instead of 404 (soft 404) · **MEDIUM** · UPSTREAM, mitigated

| | |
|---|---|
| Routes | `/professionals/[slug]`, `/services/[slug]`, `/countries/[countryCode]` |

**Reproduction.** `curl -o /dev/null -w "%{http_code}" /services/bogus-service`

**Expected** 404 · **Actual** 200, in dev **and in the production build**.

The *content* is correct — the correct not-found page renders, with the
correct title ("Service not found") and `noindex`. Only the status line is
wrong.

**Root cause — isolated, not guessed.** Application code is correct: all
four dynamic routes call `notFound()`. The deciding factor is
`generateStaticParams`:

- `/resources/[slug]` returns `[]` (nothing is published) and correctly
  returns **404**;
- the other three return a non-empty list, so vinext renders the unknown
  param dynamically, honours `notFound()` by rendering the boundary, and
  **serves it with 200**.

Tested the obvious hypothesis and disproved it: removing a route's local
`not-found.tsx` and rebuilding still returned 200, so the boundary file is
not the cause. This is a vinext framework limitation with no safe in-repo
workaround — the status is set by the framework's response.

**Mitigation already in place:** every one of these pages emits
`noindex, follow`, so a crawler will not index a soft 404. Recorded for
Day 10 / an upstream issue.

---

## 7. What was tested and found correct (no change needed)

**Directory search and filters** — 19 cases on fixture data, dev and
production, with identical counts in both (baseline 16, `country=US` 3,
`service=payroll-services` 5, `q=sarah` 1, `mode=remote` 15):

- case-insensitivity, surrounding whitespace, multi-word AND semantics,
  no-results empty state;
- **every invalid value degrades safely to unfiltered** rather than erroring
  or returning zero: `country=ZZ`, `service=nope`, `language=xx`,
  `jurisdiction=NOPE`, `mode=telepathy`, `sort=bogus` → 16 results;
- `page=0 | -3 | abc | 1e9` → page 1; `page=9999` clamps to the last page
  rather than 404ing, and the pagination control builds its links from the
  **clamped** page, so Previous/Next stay correct on a stale deep link;
- **XSS**: `?q=<script>alert(1)</script>` renders escaped
  (`&lt;script&gt;…`) in the chip row — verified in the HTML, not assumed.

**Tax jurisdiction vs location** — confirmed separate axes in
`filterProfessionals`: jurisdiction is matched against the row's own
`jurisdictionCodes` and never derived from country. Locked in by test.

**URL synchronisation** — real browser interaction: checking Country →
`?country=US`; adding a service →
`?country=US&service=individual-tax-preparation`; **Back** restores
`?country=US` with the checkbox re-checked and 3 results; chips render
("Country: United States" + "Remove…"); "Clear all filters" → bare
`/find-accountant`. Defaults are never serialised.

**Data integrity on profiles** — `getPublishedProfile` returns `undefined`
for unknown, unapproved and unpublished slugs alike, so a draft is
indistinguishable from a typo. **Verified the unpublished fixtures
(`atlas-fiscal-group`, `helena-fischer`) appear in 0 files of the production
bundle** — the Day 5 regression has held.

**SEO** — sitemap contains exactly 11 URLs (`/`, `/services`, `/resources`,
8 service pages). No profile, no country, no `/find-accountant`, no
`/admin`, no draft, no fabricated `lastmod`. Every page's `robots` directive
agrees with its sitemap presence. `robots.txt` disallows `/admin`,
`/sign-in`, `/api/`, and the nine faceted-search parameter forms.
`/countries/us` and `/countries/US` both resolve but both emit the canonical
`…/countries/US`, so case is not a duplicate-content vector.

**Responsive** — 9 routes × 375/768/1024/1440 via sized iframes (media
queries evaluate against the frame viewport). **Zero horizontal overflow
anywhere** (`scrollWidth` ≤ viewport in all 22 combinations measured).

**Accessibility that passes** — single `h1` per page; **no heading-level
skips** across 38 headings on `/`; `main` landmark and a working skip link;
`lang="en"`; all 14 images have `alt`; **0 links and 0 buttons without an
accessible name**; **all 64 directory form controls labelled**;
`prefers-reduced-motion` neutralises animation, transition and smooth
scrolling globally; visible `:focus-visible` ring at 6.72:1.

**Console** — no errors, no warnings and **no hydration mismatches** on a
fully-filtered directory URL.

**Images** — all 14 referenced images and all 6 icons return 200. No broken
images on any route (`naturalWidth > 0` verified for the lazy world map once
scrolled into view).

---

## 8. Performance

**Production build** (`npm run start`, workerd, localhost, unthrottled):

| Metric | Measured |
|---|---|
| LCP | **1004 ms** (element: hero `IMG`, correctly `priority`) |
| CLS | **0.0217** |
| TTFB | 175 ms |
| DOMContentLoaded | 1075 ms |
| Load | 1650 ms |
| Initial requests / weight | 25 / **315 KB** |
| — JS | 19 files, 166 KB |
| — CSS | 1 file, 57 KB |
| Fully scrolled | 33 requests / 551 KB |

LCP and CLS are inside the "good" thresholds, but localhost with no
throttling is a floor — these are **not** field numbers and should not be
quoted as Core Web Vitals pass/fail. INP was not measured: it needs real
interaction traces.

Build output totals: 1612.6 KB of client JS across 217 files (largest chunk
214.1 KB), 56.5 KB CSS.

Only one change was made (BUG-06, −190.6 KB). No optimisation library was
added. The 57 KB CSS and the 214 KB chunk are recorded for Day 10 rather
than speculatively split.

---

## 9. CMS review (isolated local preview)

Reviewed on a **separate local instance** (`CMS_PREVIEW=enabled`, port 5174),
stopped immediately afterwards. No mutation was attempted and no record was
modified.

**The build gate works, verified both directions:** with the flag unset,
`/admin` and all 10 sub-routes return **404 in the production build**, and
searching the built output for CMS strings finds only the `notFound()` stub
(`CmsExcludedFromProduction`) — the one `admin-fixtures` hit is a filename
inside a source-map comment, not data. With the flag set, all 11 routes
render.

**The screens are honest.** The overview carries a "Local preview —
unauthenticated" badge and a panel stating that no sign-in, session or role
check exists anywhere in the project, that the exclusion is a *build gate,
not authorization*, and that server-side auth plus authorized Convex queries
are required before `/admin` may be enabled anywhere.

**Saves are not simulated.** `EditorialActionBar` has no success path at
all; every transition control is disabled and distinguishes an actionable
validation blocker from the non-actionable missing backend.

**BLOCKED — production blocker.** The CMS cannot be deployed. It has no
authentication, no authorization and no server-side enforcement. The build
exclusion is the only thing keeping it off the internet, and a build-time
flag is not an access control. Backend ownership.

---

## 10. Convex integration

| Check | Result |
|---|---|
| Provider initialisation | **PASS** — `ConvexClientProvider` renders children unwrapped when `NEXT_PUBLIC_CONVEX_URL` is absent, so a missing URL degrades instead of throwing. |
| Environment variables | **PASS** — documented mismatch handled: `npx convex dev` writes `VITE_CONVEX_URL`, vinext only inlines `NEXT_PUBLIC_*`, and `.env.example` explains the manual mirror. No secret is committed. |
| Generated API types | **PASS** — `convex/_generated` present and typechecks. |
| Public/private boundary | **PASS at the frontend layer** — `public-content-adapter.ts` imports **no fixture module at all**, so there is no import edge for a bundler to follow. Verified: unpublished fixtures appear in 0 production bundle files. |
| Publication-state filtering server-side | **BLOCKED** — unverifiable from this repository. |
| Query loading / error / network-failure behaviour | **BLOCKED** — no public Convex query exists yet to exercise. |

**Backend contract that needs review before Phase 1 ships** —
`professionals:search`, `professionals:getPublishedBySlug` and the `cms:*`
reads must filter by publication status **server-side**. The frontend
mappers are a second line of defence, not the boundary: anything the server
sends is readable by the caller whether or not the page renders it. The
directory is still fixture-backed; there is no `convex/professionals`
module. Not rewritten here — backend ownership.

---

## 11. Automated tests added

No test infrastructure existed. Rather than install a framework, the suite
uses **Node's built-in test runner against TypeScript that Node 24
type-strips itself — zero new dependencies, and `package-lock.json` is
unchanged.**

The one gap is that Node does not read `compilerOptions.paths` or resolve
extensionless imports, both of which a bundler normally provides; a 60-line
`scripts/test-resolver.mjs` restores them via `module.registerHooks`.

One script added, matching existing conventions:

```json
"test": "node --import ./scripts/test-resolver.mjs --test \"src/**/*.test.ts\""
```

**48 tests, all passing**, covering what section 18 of the brief asks for:

| File | Tests | Covers |
|---|---|---|
| `directory-query-params.test.ts` | 12 | query parsing, trimming, length bound, repeated-vs-comma params, unknown-value rejection, de-duplication, page clamping, serialization, Clear All, pagination reset, encoding, parse∘serialize round trip |
| `directory-search.test.ts` | 10 | keyword semantics, empty results, country/service/mode filters, **jurisdiction as its own axis**, sorting, non-overlapping pages, out-of-range clamping, city options derived from data |
| `public-data-boundary.test.ts` | 10 | invalid/unpublished slugs indistinguishable, every public profile approved+published, **no credential claims verification without a review record**, empty public repository, invalid country/service codes, catalogue ≠ discoverable, **sitemap excludes every noindex route**, no fabricated timestamps |
| `class-merge.test.ts` | 7 | **BUG-01 regression** — all 35 size×colour pairs survive, button base keeps its size through a variant colour, real conflicts still resolve, radii, conditional overrides |
| `palette-contrast.test.ts` | 6 | **BUG-07 regression** — token ratios read out of `globals.css` itself: body/secondary text, action as text *and* as a button background, the hover shade's legibility and darkness, status colours, focus ring, checkbox accent |
| `globals-layers.test.ts` | 3 | **BUG-10 regression** — element defaults are inside `@layer base`, no bare element rule is left unlayered, and the reduced-motion override stays unlayered and `!important` |

Each of the three regression files was checked to actually fail against the
defect it covers, rather than assumed to: `class-merge` fails 42/42
combinations on the old `cn()` config, `palette-contrast` reports
"action on white is 4.27:1" on the old token, and `globals-layers` names `a`
as the offender when the rule is moved back out of the layer.

---

## 12. Files changed

Commit 1 — `1d40370` *fix: stabilize marketplace frontend and resolve Day 9 QA issues*

```
 package.json                                   |   1 +   (test script)
 public/images/ATTRIBUTIONS.md                  |  18 +-  (BUG-06 accuracy)
 public/images/world-map.svg                    | 404 +-  (BUG-06, -190.6 KB)
 src/components/directory/filter-panel.tsx      |  23 +-  (BUG-04)
 src/components/home/featured-professionals.tsx |  49 +-  (BUG-02)
 src/components/layout/mobile-navigation.tsx    |  74 +-  (BUG-03)
 src/components/layout/nav-dropdown.tsx         |   8 +-  (BUG-03, focus restore)
 src/components/shared/professional-card.tsx    |  16 +-  (BUG-05)
 src/lib/utils.ts                               |  51 +-  (BUG-01)
 scripts/test-resolver.mjs                      | new
 src/lib/__tests__/ (4 files)                   | new
```

Commit 2 — the contrast work (BUG-07), and BUG-10 which it uncovered

```
 src/app/globals.css                            |  BUG-07 token + BUG-10 @layer base
 src/components/directory/filter-panel.tsx      |  accent-[#0879e9] -> accent-action
 src/components/countries/countries-hero.tsx    |  glow shadow follows the token
 src/components/countries/country-overview.tsx  |  glow shadow follows the token
 src/components/directory/accountant-search-bar.tsx | glow shadow follows the token
 src/components/home/global-coverage.tsx        |  glow shadow follows the token
 src/components/home/professional-cta.tsx       |  glow shadow follows the token
 src/components/shared/accountant-search.tsx    |  glow shadow follows the token
 src/components/shared/brand-logo.tsx           |  documents the deliberate divergence
 scripts/generate-icons.mjs                     |  documents the deliberate divergence
 src/lib/__tests__/palette-contrast.test.ts     | new (BUG-07 regression)
 src/lib/__tests__/globals-layers.test.ts       | new (BUG-10 regression)
 docs/DAY9_QA_REPORT.md                         |  this report
```

No Convex function, schema, migration, environment variable, Cloudflare
configuration or deployment setting was touched. `package-lock.json` is
unchanged. No database operation of any kind was performed.

---

## 13. Final verification

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (exit 0) |
| `npm test` | **PASS** — 48/48 |
| `npm run build` | **PASS** (exit 0) |
| `npm run start` + production sweep | **PASS** — 14 routes, `/admin` 404, filter counts identical to baseline |

Regression check against the pre-fix baseline: directory counts match
exactly (16 / 3 / 5 / 1 / 15 / 16 / 0-empty-state), navigation intact, all
images 200, console clean, sitemap still 11 URLs, CMS still absent from the
production build.

After the contrast work specifically: anchors rendering the wrong colour
**38 → 0**; Sign Up measured in the live production build at white on
`rgb(7,110,212)` = **5.01:1** at 14px; "Home" and "View All Professionals"
both 5.01:1; zero occurrences of the old hex or its RGB triple in the served
CSS; and the focus-ring behaviour confirmed byte-identical to a build of the
committed baseline, so the layer change introduced no focus regression.

Not deployed to Cloudflare.

---

## 14. Outstanding issues

### OPEN-01 — Fabricated marketing content remains published on `/` · HIGH · product decision

BUG-02 labelled the four professional cards. It did **not** touch, because
removing them is a content decision against an explicitly approved reference
design and outside a QA pass's authority:

- **stats band**: "10,000+ Verified Professionals", "100,000+ Happy
  Clients", "4.9/5 Average Rating", "24/7 Customer Support";
- **testimonials**: three invented clients with invented quotes and
  hard-coded 5-star rows, under the heading "What Our Clients Say", with a
  "View All Reviews" link;
- **hero trust list**: "Verified Professionals — Background & credential
  checks", "Transparent Pricing", "Secure Document Sharing";
- the per-card ratings, rates and availability themselves, now labelled.

None is backed by data, the platform has no reviews and no verification, and
`/` is the only indexable page of the three that describe these records.
`ATTRIBUTIONS.md` already records that this was a literal replica of a
supplied reference "not data this project's own PRD.md/AGENTS.md would
otherwise allow fabricating".

**Recommendation:** before any public launch, either remove these or replace
them with claims that are true. This is a launch blocker for a real brand,
and it needs a product owner, not a QA pass.

### Other open items

| ID | Item | Severity | Owner |
|---|---|---|---|
| BUG-11 | Focus ring renders `currentColor` (navy, 13.82:1) instead of `--color-focus` — hue wrong, visibility fine | Low | Day 10 |
| BUG-08 | `--color-border` 1.32:1 on form controls vs 3:1 required (1.4.11) | Low | Design/brand |
| BUG-09 | Soft 404s on three dynamic routes (vinext limitation; `noindex` mitigates) | Medium | Upstream / Day 10 |
| — | Screen-reader pass with a real AT (NVDA/VoiceOver) not performed | — | Day 10 |
| — | Firefox, Safari/WebKit, Edge **NOT TESTED** — unavailable here | — | Day 10 |
| — | `npm audit`: 14 vulnerabilities (7 high) not triaged | — | Day 10 |
| — | `workerd` postinstall not in the script allowlist | Low | Day 10 |
| — | Lighthouse / CrUX field data unavailable; INP unmeasured | — | Day 10 |

---

## 15. Production blockers

1. **CMS has no authentication or authorization.** Build-excluded today; the
   gate is not an access control. Backend.
2. **Convex public queries must enforce publication state server-side.**
   Unverifiable from this repo; the contract needs review before real data
   is served.
3. **OPEN-01 — fabricated ratings, reviews, stats and testimonials on an
   indexable page under a real brand.** Product.
BUG-07 is **resolved** and no longer a blocker: the contrast failure on
primary button labels was fixed in this pass (token darkened to `#076ed4`),
together with BUG-10, which was the reason those labels were not actually
white in the first place.

---

## 16. Day 9 acceptance checklist

| Item | Status |
|---|---|
| Git branch confirmed | PASS |
| Initial health check completed | PASS |
| Homepage tested | PASS (1 high bug fixed, OPEN-01 raised) |
| Accountant directory tested | PASS |
| Search and filters tested | PASS |
| Sorting tested | PASS |
| Pagination tested | PASS |
| Professional profiles tested | PASS |
| Services pages tested | PASS |
| Country pages tested | PASS |
| Navigation tested | PASS |
| CMS UI reviewed safely | PASS (deployment BLOCKED — no auth) |
| Convex integration verified where possible | PARTIAL — server-side filtering BLOCKED |
| Responsive layouts tested | PASS (375/768/1024/1440, zero overflow) |
| Accessibility issues reviewed | PASS with findings (5 fixed; 1 brand token, 1 cosmetic outstanding) |
| SEO functionality verified | PASS |
| Images and assets checked | PASS |
| Performance measured where possible | PASS (production build; no field data) |
| Confirmed frontend bugs fixed | PASS — 8 of 11; 3 outstanding (1 brand token, 1 cosmetic, 1 upstream) |
| Regression tests completed | PASS |
| QA report created | PASS |
| No destructive database operations | PASS — none performed |
| Cloudflare configuration preserved | PASS — untouched |
| TypeScript checks pass | PASS |
| Lint passes | PASS |
| Production build passes | PASS |
| Changes remain on `feat/frontend` | PASS |
| Cross-browser (Firefox/Safari/Edge) | **NOT TESTED** — unavailable |
| Screen-reader pass with real AT | **NOT TESTED** |

**Day 9 status: COMPLETE**, with three items explicitly carried forward
because they belong to backend, product and upstream owners rather than to a
frontend QA pass.
