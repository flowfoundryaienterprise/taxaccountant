# TaxAccountant.com

**Global Tax & Accounting Marketplace**  
A phased marketplace project for helping individuals and businesses discover and, in later releases, work with tax and accounting professionals across jurisdictions.

## Overview

TaxAccountant.com is being designed as a **two-sided international marketplace** for three broad audiences:

- **Customers:** Individuals and businesses looking for professionals who can serve their particular tax jurisdiction and service needs.
- **Professionals:** Eligible accountants, tax advisers, bookkeepers, and firms who may eventually maintain profiles, receive enquiries, and collaborate with clients.
- **Marketplace operators:** Authorized staff who manage marketplace content, country/service coverage, and, in later phases, verification, quality, and financial operations.

The project treats **where a customer or professional is located**, **which tax jurisdiction applies**, and **where a professional is authorized to practise** as separate concepts. A public profile or country page does not automatically imply verified credentials or permission to provide regulated services.

## Development roadmap

| Phase | Focus | Main deliverables |
| --- | --- | --- |
| **1 — Public Marketplace & Foundation** | **Current phase** | Original responsive landing page, country/service taxonomy, professional directory, filters and profile pages, SEO, limited staff CMS, analytics and public-content management. |
| **2 — Accounts & Verification** | Planned | Customer, business, professional and staff accounts; secure onboarding; qualification reviews; profiles; dashboards; role-based access. |
| **3 — Marketplace Transactions** | Planned | Enquiries, quotes, bookings, engagement workflows, private messages and documents, payments/refunds where supported. |
| **4 — Revenue & Operator Tools** | Planned | Professional subscriptions, lead credits, promoted listings, commissions, financial reconciliation, moderation and reporting. |
| **5 — Global Expansion & Optimization** | Planned | Language localization, approved country activation, jurisdiction-specific controls, improved discovery, reliability and scale. |

Phase 1 uses a **28-day proposed delivery plan**; the timeline is a planning target, not a production launch commitment. Later phases require separate reviews and acceptance gates.

### Current Phase 1 priorities

1. Establish a polished, accessible **landing page** following the approved premium light-blue design direction.
2. Build the public **Find an Accountant** experience, service and jurisdiction filters, and professional detail templates.
3. Develop country/service landing pages and an editorial content foundation.
4. Add a restricted staff CMS for approved content, with publish/unpublish and audit controls.
5. Validate SEO, performance, accessibility, privacy, deployment, and environment isolation.

**Not part of Phase 1:** Public customer/professional signup and dashboards, live booking, secure tax-document exchange, transactions, subscriptions, and paid lead credits. These belong to subsequent phases. A narrowly scoped staff login may be introduced earlier to protect the Phase 1 CMS.

## Technology stack

| Layer | Selected technology | Role |
| --- | --- | --- |
| UI | Next.js App Router, React, TypeScript | Website pages, server rendering and interactive components |
| Styling | Tailwind CSS, shadcn-style UI components, Lucide icons | Design system, accessible reusable UI |
| Hosting | Cloudflare Workers using **vinext** | Full-stack Next.js deployment target |
| App backend/database | Convex | Document schema, queries, mutations, actions and data relationships |
| Authentication | Better Auth + Convex adapter **(integration planned)** | Staff access initially; broader account system in Phase 2 |
| Object storage | Cloudflare R2 **(integration planned)** | Approved public media; protected files in later phases |
| Product analytics | PostHog **(integration planned)** | Consent-aware product events and usability measurements |
| Search | Convex indexes initially; decision pending search proof of concept | Directory discovery, filtering, pagination and relevance |

The client master plan proposed PostgreSQL and an external search engine. **Using Convex instead of PostgreSQL and the final search implementation require architecture approval.** Do not silently add another database or search service.

## Repository structure

The repository currently includes the following primary paths (other paths may be added as features are implemented):

```text
taxaccountant/
├── src/
│   ├── app/                 # App Router pages, layouts, CSS and route handlers
│   ├── components/          # Layout, shared components and UI primitives
│   └── lib/                 # Shared frontend helpers
├── convex/
│   ├── schema.ts            # Convex data schema and indexes
│   ├── healthCheck.ts       # Minimal backend connectivity check
│   └── _generated/          # Generated Convex type bindings
├── documents/               # PRD, design, architecture, database, API, coding rules
├── docs/
│   └── DAY1_FOUNDATION.md   # Initial foundation/compatibility notes
├── cloudflare.config.ts     # Worker runtime/deployment configuration
├── vite.config.ts           # vinext/Vite configuration
├── next.config.ts           # Next.js configuration
├── .env.example             # Safe environment variable template
└── package.json             # Scripts and dependencies
```

## Getting started

### Prerequisites

- Node.js and npm compatible with the repository's installed dependencies (use a supported current LTS release where possible).
- Git and a GitHub account with permission to access this **private repository**.
- A Convex account with access to the shared development project for database-backed development.
- Cloudflare account access **only** for deployment or Worker configuration tasks.

### 1. Clone and install

```powershell
git clone https://github.com/flowfoundryaienterprise/taxaccountant.git
cd taxaccountant
npm ci
```

### 2. Create a local environment file

In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Never commit `.env.local`, `.dev.vars`, secrets, access tokens, or service credentials. The committed `.env.example` intentionally contains **variable names only**.

### 3. Configure Convex development

In **Terminal A**:

```powershell
npx convex dev
```

Use the **existing shared Convex project** when prompted; do not create an unrelated deployment without team agreement.

> **Current vinext/Vite caveat:** Convex CLI may write `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` into `.env.local`. The browser-side application currently expects `NEXT_PUBLIC_CONVEX_URL`. Set `NEXT_PUBLIC_CONVEX_URL` to the same development deployment URL as `VITE_CONVEX_URL` in `.env.local`. Leave `CONVEX_DEPLOYMENT` as created by the CLI. See `.env.example` and `docs/DAY1_FOUNDATION.md` for details.

Example **placeholders** (not real credentials):

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
VITE_CONVEX_URL=https://your-dev-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-dev-deployment.convex.site
CONVEX_DEPLOYMENT=dev:your-deployment-name
```

Do not copy sample deployment identifiers into production settings. Better Auth, R2 and PostHog variables will be added **when those integrations are implemented and approved**.

### 4. Run the frontend

In **Terminal B**:

```powershell
npm run dev
```

Open the **local URL shown in the terminal**. The current repository runs through Vite/vinext, so do not assume it always uses port 3000.

### 5. Run quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

These commands are defined in the current `package.json`. A successful local build does **not** prove a production Cloudflare deployment or a complete authentication flow.

### Available npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite/vinext development server |
| `npm run build` | Build the application |
| `npm run start` | Preview the built application with Vite |
| `npm run preview` | Build and then preview |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run convex:dev` | Start Convex development synchronization |
| `npm run cf-typegen` | Generate Cloudflare Worker binding types |
| `npm run deploy` | Deploy the Worker (requires approved Cloudflare access) |

## Deployment and environments

The application targets **Cloudflare Workers** and currently declares a Worker named `taxaccountant-app` in `cloudflare.config.ts`. It is **not** a Scheduled/Cron Worker.

1. Maintain separate **development, staging, and production** configuration and Convex deployments; only development is confirmed in the initial foundation notes.
2. Validate a production-compatible build and SSR behavior in the Workers runtime.
3. Configure scoped Cloudflare secrets, URLs, domains and later R2/Better Auth integrations per environment.
4. Promote reviewed changes through staging before an explicitly approved production deployment.

Deployment (only with permission and the correct environment selected):

```powershell
npm run build
npm run deploy
```

**Status note:** `docs/DAY1_FOUNDATION.md` records local Workers-runtime SSR checks; a real remote deployment smoke test and staging/production provisioning still need separate verification. Do not interpret the presence of deployment configuration as proof of a live production release.

## Contributors and collaboration

| Responsibility | Owner |
| --- | --- |
| Frontend, UI/UX, design system | **Sri Harsha M** |
| Convex schema, indexes and data relationships | **Sri Harsha M** |
| Convex business logic, queries/mutations/actions, integrations | **Ajay** |
| Better Auth backend and server-side authorization | **Ajay** |
| Frontend-backend integration, testing, deployment review | **Shared** |

The repository should use reviewed pull requests. A suggested workflow is `frontend` for UI work, `database` for schema work, `backend` for service work, and `main` for integrated changes. Coordinate **schema and typed function contracts before merging**. Do not force-push or overwrite another developer's work.

## Design standards

The approved master-plan visual direction is **premium, trustworthy, light blue and accessible**.

| Token | Color |
| --- | --- |
| Deep navy | `#102C57` |
| Action blue | `#0879E9` |
| Pale blue | `#EAF5FF` |
| White | `#FFFFFF` |
| Slate text | `#4C6178` |

Use reusable components, a mobile-first layout, semantic markup, keyboard-accessible controls and WCAG 2.2 AA as the accessibility target. Never publish invented qualifications, client counts, profile ratings, country coverage, availability, or testimonials.

## Security and data handling

- Enforce authorization inside server-side Convex functions, **not only in the UI**.
- Publish only approved professional records and permitted country/jurisdiction/service combinations.
- Keep tax IDs, private tax documents, credentials and other sensitive user information out of public forms, URLs, logs and analytics.
- Store approved website images separately from future protected professional credentials and engagement documents in R2.
- Use least-privilege environment credentials, short-lived authorized file access and explicit consent for optional analytics.
- Require legal/provider approval before enabling regulated services, marketplace payments, verification claims or new countries.

## Project documents

Read these documents before changing product behavior or architecture:

- [Product requirements](documents/PRD.md)
- [Design system](documents/DESIGN.md)
- [Architecture](documents/ARCHITECTURE.md)
- [Database model](documents/DATABASE.md)
- [API and integrations](documents/API.md)
- [Coding rules](documents/AGENTS.md)
- [Implementation plan](documents/IMPLEMENTATION_PLAN.md)
- [Day 1 foundation notes](docs/DAY1_FOUNDATION.md)

If documents conflict, flag the inconsistency for review rather than silently changing product scope. The global five-phase marketplace master plan remains the authoritative business vision; current source and test evidence determine which features are actually working.

## Current development status

**In progress:** Phase 1 public marketplace foundation. The `main` branch contains the vinext/Next.js scaffold, a Convex schema and backend health-check function, initial reusable components, environment templates, and architectural documents. The complete landing page, public search, CMS workflows, and later-phase dashboards are **not assumed to be shipped** based solely on planning files.

**Immediate implementation priority:** Complete and validate the responsive public landing page, then the professional discovery/search experience and content-management foundation.

---

**Maintained by FlowFoundry AI Solutions.** Internal development repository; licensing and public distribution rights have not been specified.
