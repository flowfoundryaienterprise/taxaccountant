# AGENTS.md — Coding Rules for TaxAccountant.com

**Applies to:** All humans and AI coding agents modifying this repository. **Read first:** `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `IMPLEMENTATION_PLAN.md` and the applicable phase/task.

## 1. Project contract

- TaxAccountant.com is a five-phase **worldwide tax/accounting professional marketplace**, **not** a single accounting firm's brochure site.
- Build **only the approved current phase**. Phase 1: public country/service directory, curated professional profiles, CMS, international SEO, contact/professional-interest forms and analytics. Public user accounts and full verification are Phase 2; transaction flows Phase 3; monetization Phase 4; country-scale features Phase 5.
- Selected direction: Next.js + TypeScript + Tailwind CSS, Cloudflare Workers, Convex, Better Auth via Convex adapter, Cloudflare R2, PostHog. Any difference from signed scope or source master plan needs written approval.
- Do not invent professional profiles, ratings, credentials, permissions, prices, service-country eligibility, tax/legal copy, availability or payment states.

## 2. Before every modification

1. Read the relevant documentation and inspect existing files, package versions, generated Convex types and tests.
2. Identify exact route/component/function/collection, current behavior, dependencies and likely impact.
3. Write a short plan for complex or risky changes. Ask about blocking unknowns rather than guessing.
4. Reuse the smallest existing consistent pattern. Do not wholesale rewrite, change packages or redesign unrelated pages.
5. Keep edits small, focused and reversible; surface external service access/credential needs before implementation.

## 3. Type safety and code quality

- TypeScript strict; no casual `any`, unsafe casts, unchecked nullable properties or swallowing errors.
- Use meaningful PascalCase component types and camelCase variables/functions; route/module naming follows established conventions.
- Keep business rules and authorization in **Convex service helpers/mutations**, not JSX event handlers.
- Server-side validation is required for **every** write and protected query. Keep shared DTO/schema validation consistent with `API.md`.
- Prefer pure reusable functions, small modules and self-descriptive names. Keep code and comments free of stale promises/unimplemented behavior.
- Never add dependencies without documenting why existing APIs/standard libraries are inadequate; check license and maintenance.

## 4. Frontend and design

- Follow `DESIGN.md` palette and spacing; use accessible shared components and mobile-first layout.
- Every async view includes loading, empty, success and error states where applicable. Forms preserve entered content on recoverable failure.
- URLs preserve search filters and pagination. Published directory and SEO pages must render indexable server output; do not regress to client-only empty HTML.
- Labels/ARIA/keyboard, reduced motion and responsive states are release requirements, not optional polish.
- Never publish fake verified badges, reviews or “available now” status; paid placements later require clear `Sponsored` labels.

## 5. Convex data rules

- The Convex schema and domain contracts live in `DATABASE.md` and `API.md`. No SQL migrations, SQL RLS or assumptions about foreign key enforcement.
- Before schema changes, document affected reads/writes, query indexes, backfill needs and production compatibility.
- Index queries based on actual query shapes. Avoid unbounded `.collect()` and full-table client filtering.
- Guard referenced IDs, ownership, organization membership, publication, country activation and valid state transitions **inside every function**.
- No client privilege from submitted `userId`, `role`, `verified`, `paymentSucceeded` or similar booleans.
- Audit privileged content/verification/country/financial changes. Do not log message text or private tax data.
- Additive migrations and tested idempotent seeds only. **Never reset production data** or publish test fixtures.

## 6. Authentication and secrets

- Use the approved Better Auth + Convex integration; do not create parallel auth/session/token models.
- Staff CMS Phase 1 identities are provisioned, not self-registering; full self-service roles start in Phase 2.
- Fail closed if auth is missing, invalid, expired, role revoked, org suspended or authorization uncertain.
- Never store passwords/tokens in local storage by custom code or add credentials to source, `.env.example`, docs, PRs or logs.
- Environment-specific secrets belong in provider secret settings; keep browser-exposed values explicitly allowlisted.
- Test direct Convex calls and guessed resource IDs, not merely hidden UI buttons.

## 7. R2 and file safety

- R2 holds bytes; Convex holds ownership/classification/scan state. Public media and private credentials/documents must not share public access rules.
- Presign only after server role/resource check; set short expiry and specific object, method and allowed size/type.
- Verify upload completion; scan sensitive files before granting private-party access. No public links for credentials or tax documents.
- Never delete referenced objects blindly. Implement failure/orphan cleanup and retention-aware deletion.

## 8. External providers

- Search: Convex native index only if approved filters/relevance are met; document any external index change.
- Email: retries only when safe and deduped; sending failure may not invalidate successful database submission.
- Payments (Phase 3+): PSP signatures, idempotency, supported-country gating, integer minor units, refunds and ledger reconciliation.
- Analytics: consent-aware events without personal tax data, message contents, email/phone, auth tokens or sensitive URLs. Disable private-area session replay by default.
- Do not claim external requests/webhooks succeeded without response evidence.

## 9. Tests, review and deployment

- For each feature, add relevant unit/integration tests and at least one failure/permission case. Critical user journey changes require E2E smoke updates.
- Run available lint, typecheck, tests and production-compatible Worker build. Report exactly which commands passed, failed or were not run.
- For a bug: reproduce → localize root cause → minimal fix → regression test; never hide failure by removing validation/tests.
- Staging first; production only after approved release gates. Test rollback, Convex export/restore and R2 recovery before launch.
- No destructive commands, deletion of production resources, paid service provisioning, legal claims or irreversible migration without approval.

## 10. Git and documentation discipline

- One feature/fix per focused branch or commit; concise commit message and issue reference when available.
- Do not commit `.env*` secrets, R2 credentials, auth exports, data dumps with PII or third-party proprietary assets.
- Document public contract/schema/config changes in the matching source-of-truth file; update changelog/release checklist as relevant.
- If documents conflict, stop and identify the conflict. Priority: **approved current scope/change request → current project docs → existing implementation**. A source-document divergence is an approval issue, not permission to invent a resolution.

## 11. Required end-of-task report

- **Scope:** what requested task was attempted; what remains.
- **Changed:** exact files/functions and migrations/indexes (if any).
- **Verification:** commands/tests and real results; manual test evidence; do not invent passing tests.
- **Security:** auth/data/privacy risks checked and outstanding.
- **Approvals/risks:** unresolved requirements and follow-up action.
- **Status:** complete, partial or blocked; no false success statement.
