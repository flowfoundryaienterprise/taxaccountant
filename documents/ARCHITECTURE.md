# ARCHITECTURE.md — TaxAccountant.com

**Status:** Architecture proposal pending client approval of database substitution, first countries and auth/hosting compatibility. Implement the least complex secure version of each phase. Read `PRD.md`, `DESIGN.md`, `DATABASE.md` and `API.md` alongside this document.

## 1. Architecture decisions

| Layer | Decision | Reason / condition |
|---|---|---|
| Web | Next.js App Router + TypeScript | SSR for indexable country/service/profile pages; reusable UI and typed contracts |
| UI | Tailwind CSS + accessible component primitives (e.g., shadcn/ui) | Small consistent design system per `DESIGN.md` |
| Deployment | **Cloudflare Workers** with supported full-stack Next.js adapter | Cloudflare Pages is suitable for static export; this site needs SSR and auth handling. Validate `vinext` compatibility first. |
| Backend | **Convex** queries, mutations and actions | One TypeScript backend and reactive data without separate CRUD microservices |
| Database | Convex document database | Requested alternative to master plan's generic PostgreSQL; requires client approval |
| Auth | **Better Auth** with official **`@convex-dev/better-auth`** integration | Store auth/session state in supported adapter; same identity used by Convex authorization |
| Files | Cloudflare **R2** | Public approved media and separately protected credentials/tax docs; metadata in Convex |
| Analytics | PostHog + Search Console; GA4 if client requires | Consent-aware product funnel monitoring and technical SEO |
| Email | Provider TBD (e.g., Resend) via Convex actions | Need receipts, review notifications and later booking/payment emails |
| Search | **Phase 1 decision spike:** Convex search/indexes if it passes functionality/performance; otherwise a documented external search adapter | Master plan expects typo tolerance, facets, synonyms and relevant ranking; do not claim Convex native search provides everything |
| Payments (Phase 3+) | Jurisdiction-eligible marketplace PSP, e.g., Stripe Connect where available | KYC/KYB, payout, country and currency capabilities require review; do not choose silently |

### Official implementation references (review versions at setup time)
- Cloudflare full-stack Next.js: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Convex + Better Auth: https://labs.convex.dev/better-auth/framework-guides/next
- Better Auth + Convex: https://www.better-auth.com/docs/integrations/convex
- Convex search: https://docs.convex.dev/search/text-search
- R2 signed URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- PostHog privacy: https://posthog.com/docs/session-replay/privacy

## 2. System boundaries and data flow

**Browser → Cloudflare Workers/Next.js:** public SSR HTML, static assets, SEO metadata, authentication frontend proxy and form UI. The frontend does not possess Convex administrative credentials or R2 secrets.

**Next.js/React → Convex:** public queries for only published approved content; authenticated queries/mutations for user-owned or staff-owned data; internal actions for provider calls.

**Better Auth → Convex auth component:** identity, credentials, session lifecycle and recovery. Application profile records store only a stable auth subject/reference, role/membership and necessary app metadata. Server functions re-check the current identity and resource ownership.

**File flow:** Convex-checked request for signed URL → direct browser upload to R2 → verified completion + metadata in Convex → public CDN only for **approved marketing images**, time-limited authorized download for private documents. Unverified objects are not publishable.

**Analytics:** user-consent-aware event capture → PostHog. No tax records, messages, email, phone, full query strings with PII or credentials in analytics/replay; replay disabled for private areas by default.

**Future payment flow:** approved-country user action → PSP host/intent → signed verified webhook → idempotent persisted financial state → user receipt/reconciliation. Client callbacks are never authoritative for payment success.

## 3. Deployment topology

- Separate Convex **dev, staging, production** deployments and separate R2 buckets/prefix boundaries per environment; avoid sharing personally identifiable staging data.
- Cloudflare Worker per environment with environment-specific secrets, aliases and logs; custom domain and HTTPS.
- Git-based CI: install, lint, typecheck, unit tests, Convex schema/type verification, production-compatible Worker build, E2E smoke on staging, explicit production approval.
- Configure scoped R2 token, cookie/Better Auth trusted origins, auth callback URLs, PostHog keys, CSP and CORS on approved domains only.
- `vinext` currently has compatibility caveats: validate SSR, auth cookies/session refresh, Next.js routes, R2 SDK calls and server runtime in a **deployed Week-1 proof of concept**. If it fails, submit a documented alternate hosting/adapter decision for approval; do not silently rewrite to a different stack.

## 4. Suggested project structure (logical, not mandated code)

- `app/` — route groups: `(marketing)`, `(directory)`, `(auth)`, `(dashboard)`, `admin`; metadata, error, loading, not-found pages; minimal auth proxy route.
- `components/` — `ui/` primitives; `layout/`; `search/`; `professionals/`; `cms/`; `forms/`.
- `features/` — presentation and form orchestration grouped by discovery, cms, profiles, accounts, engagements and billing; phases added when approved.
- `lib/` — typed routing, formatting, permission-readable UI helpers, analytics privacy wrapper, validation schemas; no backend secrets in client modules.
- `convex/` — `schema`, `auth` integration, `countries`, `jurisdictions`, `services`, `professionals`, `search`, `content`, `media`, `contact`, `audit` and phase-specific services; internal-only helpers/actions.
- `tests/` — unit, integration, E2E, fixtures and permission matrix.
- `scripts/` — safe idempotent seeds, additive migration jobs, validation and data audits.
- `docs/` — release/runbooks, provider setup, architecture decisions, backup/restore.
- Root source-of-truth files — `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `AGENTS.md`, `IMPLEMENTATION_PLAN.md`.

## 5. Read and write patterns

- Public pages fetch **published and discoverable** Convex content on the server for SEO; use safe caching/revalidation (publication invalidation must be tested).
- Public directory query accepts normalized filters; limit/paginate results, return only public projection. Avoid large unbounded `.collect()` or client-side filtering of entire collections.
- Client mutations send only allowed editable fields; server validates values, current identity, role, membership, country flags and state transitions.
- Reusable domain service helpers enforce permission and country-gate checks; never scatter ad hoc `isAdmin` logic across components.
- Backoffice writes record audit event inside the authorized write flow whenever possible; external side effects happen via actions/jobs with status tracking and safe retries.
- Atomicity: Convex mutation transactions for related app records. Financial provider state requires idempotency and reconciliation rather than assumptions of distributed ACID behavior.

## 6. Authentication and authorization

**Phase 1:** provision a minimal restricted staff account for CMS editing; role grants stored separately from Better Auth identity. No customer/professional public registration until Phase 2. Because the master plan places broad staff auth in Phase 2, **approve this necessary Phase 1 exception** before launch.

**Phase 2:** account signup/login/reset, MFA, customer/business/professional organization roles, invitation and recovery; account/organization access checked on every server function. Privileged staff MFA should be required when supported by validated Better Auth plugin setup.

- Deny by default on no session, unapproved account, missing role, inactive org, unapproved verification or country-disabled action.
- Authorization source is server-side Convex + auth session, **not** UI flags.
- Scope multi-user firm/org data by verified membership and fine-grained permissions; no cross-org leakage.
- Use session expiry/refresh per official integration; protect server actions and cache boundaries.

## 7. R2 object strategy

- Public marketing/media object store: approved media only, stable publish URL via CDN custom domain, cache control and alt text in Convex.
- Private store: Phase 2 credential uploads and Phase 3 engagement documents; random opaque object keys with owner refs in Convex. Never expose direct public buckets for these.
- Short-lived signed PUT/GET, per-role authorization, validated size/MIME and server-side content verification after upload; antivirus/malware scanning **before** private documents become shareable.
- Upload lifecycle: `initiated → uploaded → scanning → approved/rejected`; orphan cleanup and safe deletion workflow; retention and legal hold decisions require counsel.
- R2 buckets/credentials isolated by environment; least-privilege API tokens; restore tests for both Convex metadata and R2 objects.

## 8. Search architecture gate

- Required Phase 1 filters: country, tax jurisdiction, service, language, optional verified credentials, remote/on-site, available price/rating and sort. Preserve filter state in URL.
- Week 1 test fixture: meaningful combinations across multiple seeded countries and jurisdictions, multiple specialties/languages, zero-results, pagination and typo/synonym test cases.
- Convex full-text indexes support a single text search field and equality filter fields, but **do not promise dedicated engine-style typo tolerance/faceting/synonyms** without proof.
- If acceptance criteria fail, request approval to adopt Meilisearch/OpenSearch with a Convex → index update/queue reconciliation flow. Convex remains the source of truth; search responses must be re-filtered for publication/eligibility when needed.

## 9. API and external integration conventions

- Use **typed Convex functions**, not arbitrary REST for each entity. Required HTTP boundary: Better Auth handler/proxy, approved R2 signing operations if used, and future payment webhook endpoints.
- Use Zod or Convex validators consistently, typed discriminated error codes, structured logs with non-sensitive request identifiers, bounded retry on idempotent operations.
- Apply rate limits to public forms, search, login and upload signing, and provider-call queues. Do not log full contact messages, filenames revealing sensitive data, financial data or raw auth headers.
- No AI architecture is necessary for MVP. AI tax advice is expressly not planned; any future AI matching requires a separate approval and evaluation/privacy design.

## 10. Testing strategy

**Phase 1:** unit validation/query tests, staff authorization, content visibility, directory filter/search/pagination, responsive accessibility, SSR/canonical/crawl tests, contact anti-spam, R2 permission checks, build and staging smoke.

**Phase 2:** role/organization negative-permission matrix, MFA/session, credential approval gate, deletion/export request security.

**Phase 3:** booking race/conflict and timezone cases, private document access/malware scanning, webhook signature/idempotency, refund/cancellation/payment failure/country restrictions.

**Phase 4:** ledger invariants, reconciliation, credits under concurrency, sponsored disclosure, moderation approval.

**Phase 5:** locale/currency, SLO load tests, DR failover/restore and activated-market compliance regression.

## 11. Backups, operations and phased scalability

- Define and test Convex export/recovery and R2 object recovery before production. Published content versions and metadata must be restorable together; document any limits of provider tools.
- Monitor Worker error rates, Convex errors/usage, R2 upload failure, auth failure spikes, search zero-results, provider/webhook delays, critical business transitions; integrate on-call contact as approved.
- Start with a single repository, one Convex application, no microservices or message bus. Introduce a dedicated search service, job infrastructure or additional regions **only when acceptance/data justifies it**.
- Operational policies: environment secret rotation, least-privilege access, deploy rollback, dependency patching, incident runbook and legal/privacy contact ownership.

## 12. Explicitly unresolved architecture approvals

1. Convex replaces the master plan's PostgreSQL recommendation.
2. Exact first-market countries, active tax jurisdictions, legal review criteria and content rights.
3. Full-stack Next.js Workers + Better Auth compatibility proof of concept and fallback policy.
4. Convex native search vs external index to meet typo/synonym/facet requirements.
5. Email provider, MFA requirements for Phase 1 staff, analytics consent policies.
6. PSP/KYC, availability/calendar integration, private-document malware scanning, data residency/retention and availability SLOs in later phases.
