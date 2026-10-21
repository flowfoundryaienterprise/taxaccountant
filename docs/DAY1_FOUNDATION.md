# Day 1 — Public Marketplace & Technical Foundation

Status notes for Phase 1 / Day 1 (IMPLEMENTATION_PLAN.md day 1). Source of
truth for scope and rules: `documents/PRD.md`, `documents/ARCHITECTURE.md`,
`documents/DATABASE.md`, `documents/API.md`, `documents/AGENTS.md`.

## 1. Framework confirmation

This repository had no application code before today — only `documents/`
(PRD/DESIGN/ARCHITECTURE/DATABASE/API/AGENTS/IMPLEMENTATION_PLAN) and a
placeholder `README.md`. There was **no Cloudflare Scheduled Worker, cron
Worker, or any other prior code to preserve or migrate away from.**

The app is a Next.js App Router project (`src/app/`), TypeScript strict,
deployed to Cloudflare Workers via **vinext** — the adapter
`ARCHITECTURE.md` names and flags as needing a Week-1 proof of concept.
`cloudflare.config.ts` defines a single Worker with no `[triggers]`/cron
section, so there is no risk of an accidental Scheduled Worker here.

## 2. Country vs. tax jurisdiction vs. professional authorization

Per `DATABASE.md` section 2 and `PRD.md` principle 1 ("jurisdiction before
geography"), the schema keeps three concepts separate and never derives one
from another:

| Concept | Table | Meaning |
|---|---|---|
| Customer / professional **location** | `countries`, `professionalLocations` | Where a person or firm is physically based. Carries no legal authorization meaning by itself. |
| **Tax jurisdiction** | `taxJurisdictions` (`countryId` ref, `level`: national/state/province/local/other, optional `parentId` for sub-jurisdictions) | The legal tax regime a service applies to. A country can have multiple jurisdictions (e.g. federal + state); a jurisdiction always belongs to exactly one country. |
| **Professional authorization** | `professionalServices` (`professionalId`, `serviceId`, `taxJurisdictionId`) | The explicit, per-service claim that a professional is authorized to serve a jurisdiction. This is the only table that grants "can serve X jurisdiction" — it is never inferred from `professionalLocations`. |

Consequences enforced by the schema/indexes:
- A professional based in Country A can still be authorized for a
  jurisdiction in Country B (cross-border practice) — `professionalServices`
  does not require the professional's location to match the jurisdiction's
  country.
- `taxJurisdictions.parentId` must reference a jurisdiction in a compatible
  country (DATABASE.md L21) — this check belongs in the mutation layer, not
  implied by the schema itself.
- `countries.discoverable/onboardingEnabled/transactionEnabled/paymentEnabled`
  are independent booleans; none is derived from another, and none implies a
  jurisdiction is active for search.

## 3. Likely lookup queries (not yet implemented — Day 9 per plan)

- By jurisdiction + service: `professionalServices.by_jurisdiction_service`
  → filter to `enabled=true` → join `professionals` where
  `publicationStatus=published` and `approvedProfile=true`.
- By service + jurisdiction (reverse direction for service pages):
  `professionalServices.by_service_jurisdiction`.
- By professional (profile detail page): `professionalServices.by_professional`,
  `professionalLocations.by_professional`, `professionalLanguages.by_professional`,
  `professionalPublicCredentials.by_professional`.
- Country/jurisdiction options for search filters: `taxJurisdictions.by_country`.

## 4. Search indexing — explicitly deferred

`ARCHITECTURE.md` section 8 schedules the Convex-native-search-vs-external
decision for the **Day 3 search spike**, against realistic seeded fixtures.
No full-text/search index has been added to `convex/schema.ts` yet, and no
"search document" derived collection exists. Adding either now would be
premature per `DATABASE.md` L35 ("optional derived search document/index may
be added after the search spike").

## 5. Convex environments (Task E)

- **Convention:** one Convex deployment per environment (dev / staging /
  production), each with its own `NEXT_PUBLIC_CONVEX_URL` /
  `CONVEX_DEPLOYMENT`, per `ARCHITECTURE.md` section 3. Names/variables are
  documented in `.env.example`; no values are committed.
- **Current state:** no Convex deployment has been provisioned in this
  session — see the blocker in section 6. `convex/schema.ts` and
  `convex/healthCheck.ts` are written and ready for `npx convex dev`, which
  will generate `convex/_generated/` (intentionally excluded from the root
  `tsconfig.json`'s typecheck scope — see `convex/tsconfig.json` — since that
  directory does not exist until a dev deployment authenticates).
- Staging environment configuration is **not yet documented beyond this
  convention** — it requires an approved Cloudflare/Convex account per
  `IMPLEMENTATION_PLAN.md` "Blocking prerequisites".

## 6. Known Day 1 blocker

No Convex account/CLI authentication and no Cloudflare account authentication
are available in this environment. Practical effect:
- `npx convex dev` cannot be run — no live Convex deployment, no
  `convex/_generated/*`, no frontend `ConvexProvider` wiring, no live query
  from the homepage. The homepage therefore reports "not yet connected"
  rather than asserting a working connection (see `src/app/page.tsx`).
- `npm run deploy` (`vinext-cloudflare deploy` / Wrangler) was **not run**.
  The Cloudflare Workers **runtime** was instead validated locally — `npm
  run build` followed by `npm run start` serves the real built Worker
  through the Cloudflare Vite plugin's local `workerd` runtime, which is the
  same runtime Cloudflare's edge uses. This is a genuine Workers-runtime SSR
  smoke test, not just a Node dev server, but it is **not** a deployed smoke
  test against a real Cloudflare account/domain.

Both require the client/owner to grant account access per
`IMPLEMENTATION_PLAN.md` "Blocking prerequisites" before Day 1 can be marked
fully complete.
