# Phase 1 Status Report — Frontend Scope

**Project:** TaxAccountant.com · Phase 1 — Public Marketplace & Foundation
**Branch:** `feat/frontend`
**Commit at time of writing:** `2c893b8`
**Date:** 2026-11-02
**Scope of this report:** everything assigned to the frontend role by the
master development prompt (Days 1–26). It does not cover backend-owned
work (real CMS write mutations, directory data contracts, payments,
bookings) except to say plainly where the frontend is still waiting on it.

---

## 1. Bottom line

**Not production-ready for a public marketplace launch.** It is ready for
what Phase 1 actually promises: a public content site plus a working,
auditable staff login — backed by fixtures for everything that doesn't yet
have a real backend. The gap between "this looks like a marketplace" and
"this is a marketplace" is entirely in backend scope (listed in §6), not
frontend polish.

What *is* real, not simulated:

- Staff authentication (Better Auth + Convex), gating `/admin` server-side.
- The public contact / professional-interest form — writes to Convex,
  validated server-side, with a staff-only inbox to read and triage it.
- Seven public content pages with real, PRD-sourced copy (no invented
  stats, no invented legal text).
- The country/jurisdiction counts shown across the site (`discoverableCountries.length`,
  `jurisdictionOptions.length`) — computed from the same fixture data
  everywhere, never hand-typed twice.

What is still a fixture, deliberately and visibly:

- Every CMS editorial screen except Messages (Pages, Services, Countries,
  Jurisdictions, Professionals, Articles, Media, SEO, Settings) — browsable,
  but every save control is disabled because no `cms:*` write mutation
  exists yet. This was true before this session and remains true; it is
  backend-owned, not a frontend gap.
- The professional directory and country/jurisdiction catalogue
  (`src/lib/marketplace/*`, `src/lib/directory/*`) — real-looking,
  `noindex`'d, excluded from the sitemap, and documented as fixtures in
  the code that serves them.

---

## 2. Route inventory (production build, verified)

38 routes compile and ship. Full list from `npm run build`:

**Public, indexable (8):** `/`, `/about`, `/how-it-works`, `/faq`, `/help`,
`/contact`, `/services`, `/services/:slug`, `/resources`, `/resources/:slug`

**Public, `noindex` (6):** `/find-accountant`, `/countries`,
`/countries/:countryCode`, `/professionals/:slug`, `/for-professionals`,
`/privacy`, `/terms` — each for a documented reason in
`src/lib/seo/sitemap-entries.ts` (fixture data, unlaunched capability, or
legal text pending review).

**Auth (3):** `/sign-in`, `/staff-login`, `/api/auth/:all+`

**Admin CMS (19):** `/admin` plus 9 section roots and their `new`/`:id`
routes. All present in the production build — the earlier
`cms-production-exclusion` build-time stub was removed in this session's
predecessor commit (`ddf737f`) and verified still absent.

**Infra (3):** `/api/health`, `/robots.txt`, `/sitemap.xml`

---

## 3. What this session added (Days 11, 21, 22 of the master plan)

| Commit | What |
|---|---|
| `6225f49` | Public content pages (About, How It Works, FAQ, Help, Contact, Privacy, Terms), shared `EnquiryForm`, `convex/contact.ts` `submitPublicMessage` |
| `e9d66d1` | `/admin/messages` — staff-only inbox for the contact form's output; `listMessages`/`updateMessageStatus` in `convex/contact.ts`, audited via `auditEvents` |
| `2c893b8` | Fixed a real WCAG 2.2 AA defect: `/faq` and `/contact` skipped from `<h1>` straight to the footer's `<h3>` with no `<h2>` in between |

Each commit passed `tsc --noEmit`, `eslint`, the full test suite (50/50),
and a production `npm run build` before being pushed. The Messages inbox
and the contact-form pipeline were exercised live end-to-end, not just
typechecked: a real submission through `/contact` was confirmed to land
in Convex, appear in `/admin/messages`, and move between status tabs when
changed through the UI.

---

## 4. Accessibility — verified this session

A programmatic sweep (heading order, image alt text, form label
association, accessible names on links/buttons, `<main>` landmark
presence) ran against every page added or touched this session:
`/about`, `/how-it-works`, `/faq`, `/help`, `/contact`, `/privacy`,
`/terms`, `/for-professionals`, `/admin/messages`.

One real defect found and fixed (§3, commit `2c893b8`). Everything else
came back clean. This is a sweep, not a full WCAG audit — it does not
replace a screen-reader pass or a contrast audit, neither of which ran
this session.

**Carried forward, not fixed:** BUG-11 from the Day 9 QA report (focus-ring
`outline-color` resolves incorrectly on some elements) remains open.
Investigated twice now (Day 9 and this session's predecessor commit
`8761d3e`) with no isolatable fix found; documented honestly both times
rather than claimed-fixed.

---

## 5. Performance and security — spot-checked this session

**Performance.** The one real risk — `public/images/hero-accountant.png`
is a 2 MB source file used as a full-bleed hero background — was verified
live, not assumed: the Cloudflare Images optimizer (`vite.config.ts`,
`imagesOptimizer()`) actually serves a 640px/q75 variant at **14.6 KB**
encoded, confirmed via `performance.getEntriesByType('resource')` on a
real page load. `next/image` is configured correctly for an LCP element
(`priority`, `sizes="100vw"`). No other performance work done this
session — no Lighthouse run, no bundle-size audit.

**Security.**
- `convex/staff.ts` `requireStaff` — read in full this session to verify
  the Messages inbox's authorization actually works: identity comes from
  `ctx.auth.getUserIdentity()` (never a client-supplied argument), fails
  closed on no identity or an inactive `staffMemberships` row. No defect
  found.
- `convex/contact.ts` `listMessages`/`updateMessageStatus` — both gated
  through `requireStaff`; status changes write an `auditEvents` row
  (actor, action, before/after status) but never the message text itself.
- `npm audit --omit=dev`: 18 advisories (1 critical, 8 high, 7 moderate,
  2 low). Re-verified this session, same conclusion as before: the
  critical one is `better-auth`'s OAuth-proxy / magic-link / device-login
  cluster — this app uses email+password only, no OAuth provider
  configured, and the Convex adapter rather than the Drizzle/Kysely
  adapters the advisory concerns. The remaining high/moderate advisories
  are entirely in the Vite/Miniflare/undici dev-and-build toolchain
  (`vite`, `cf`, `@cloudflare/vite-plugin`), not runtime dependencies.
  No upgrade applied — the only fix path is a major, breaking downgrade/
  upgrade of `@convex-dev/better-auth` or `vinext`, both of which need a
  deliberate, scheduled migration rather than a reflexive `--force`.

**Known gap, unchanged from before this session:** no per-sender rate
limiting on the public contact form (honeypot + elapsed-time check only).
Convex's own guidance is to use `@convex-dev/rate-limiter` rather than a
hand-rolled counter; installing it wasn't in scope for Day 11 or this
session. Flagged again here as a pre-launch item.

---

## 6. What actually blocks a Phase 1 launch

All backend-owned, listed so the next phase of work has a concrete
starting list rather than a vague "finish the backend":

1. **`cms:*` write mutations** for pages, services, countries,
   jurisdictions, professionals, articles, media — every CMS editor
   screen in this repo is real UI wired to a disabled button, by design,
   because none of these exist yet.
2. **Real `serviceCategories` rows** — `publicMessages.serviceId`
   references this table, which has zero rows; the contact form
   deliberately omits the field and uses free-text `subject` instead
   (see the comment in `convex/contact.ts`).
3. **Directory data contracts** (Day 13/14 of the master plan) — the
   professional directory and country/jurisdiction catalogue are still
   `src/lib/marketplace/*` fixtures, `noindex`'d and sitemap-excluded for
   exactly that reason.
4. **Legal review** of `/privacy` and `/terms` — both pages say so
   explicitly on-page (`LEGAL_PENDING_APPROVAL` in `src/lib/seo/indexing.ts`)
   and are `noindex`'d until that happens.
5. **`@convex-dev/rate-limiter`** on the contact form, before it is
   genuinely public-facing at any traffic volume.
6. **Analytics** (Day 20) — intentionally not wired. PostHog needs an
   approved configuration and a privacy review before any client code
   calls it; neither exists yet, so no PostHog SDK was installed.

---

## 7. Test and build status at time of writing

```
npx tsc --noEmit        → PASS (0 errors)
npm run lint             → PASS (0 errors, 0 warnings)
npm test                 → PASS (50/50)
npm run build             → PASS, 38 routes compiled
git status                → clean, HEAD == origin/feat/frontend
```

---

## 8. Recommended next task

Everything genuinely frontend-scoped and unblocked in the master plan's
Day 1–26 range is now done or already covered by earlier sessions (Day 9
QA, Day 21 responsive pass). The remaining numbered days in the plan
(12, 13, 14, 17–20, 23 in full, 24 in full) are either backend-owned
(§6) or need an external approval this session cannot grant (PostHog
config, legal sign-off). The honest next step is backend work — starting
with `cms:*` write mutations for one content type, so the CMS stops being
a read-only preview for everything except Messages.
