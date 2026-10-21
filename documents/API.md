# API.md — TaxAccountant.com Function and Integration Contracts

**Status:** Draft; `PRD.md`, `ARCHITECTURE.md` and `DATABASE.md` are authoritative. Convex is the application backend, so most APIs are **typed Convex queries, mutations and actions**, **not** REST endpoints. Use the documented HTTP boundaries only where necessary.

## 1. Shared conventions

- Public operations never return unapproved profiles, drafts, credential source files, staff notes or sensitive user data.
- Naming: `domain:verb` (e.g. `professionals:search`, `content:getPublishedBySlug`). Internal-only names prefixed/exposed as internal Convex functions and never invoked directly by untrusted clients.
- Inputs validated server-side using Convex validators and shared form validation; never trust UI-only checks.
- ID format uses Convex `Id<collection>`; external provider IDs are opaque strings; times UTC milliseconds; money integer minor units + ISO currency.
- Errors: stable code + generic user-safe message + request correlation identifier. Suggested codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `CONFLICT`, `COUNTRY_UNAVAILABLE`, `VERIFICATION_REQUIRED`, `EXTERNAL_UNAVAILABLE`.
- Avoid leaking whether private objects/accounts exist: unauthorized sensitive-resource access may return generic `NOT_FOUND`.
- Pagination: bounded cursor + configurable page size, default 20, capped at an approved safe maximum; client may not supply unrestricted collect limits.
- Idempotency required on public form submissions where feasible, uploads, payment creations, credits and provider webhook processing.

## 2. Phase 1 public Convex queries

| Function | Auth | Arguments (conceptual types) | Returns / rules |
|---|---|---|---|
| `countries:listDiscoverable` | Public | `locale?` | Approved country cards and activation-safe labels |
| `jurisdictions:listByCountry` | Public | `countryCode` | Applicable active jurisdiction options, not a claim of supported services |
| `services:listPublished` | Public | `countryCode?`, `locale?` | Published service summaries/categories |
| `services:getBySlug` | Public | `slug`, `locale?` | Published content and SEO data or not-found |
| `professionals:search` | Public | `q?`, `countryCode?`, `taxJurisdictionCode?`, `serviceSlug?`, `language?`, `credentials?`, `remote?`, `sort?`, `cursor?`, `limit?` | Paginated **approved/published** card projection; country and jurisdiction filtered separately |
| `professionals:getPublishedBySlug` | Public | `slug` | Public profile fields, service/credential context and current CTA eligibility; unapproved returns not-found |
| `content:getPublishedBySlug` | Public | `slug`, `locale?` | Render-safe published page/resource, SEO/structured-data fields |
| `content:listPublishedResources` | Public | `kind?`, `category?`, `country?`, `cursor?` | Paginated guides/blog entries |
| `settings:getPublic` | Public | none | Explicit allowlist of public settings; never secrets |

**Search semantics:** sorting and filters need actual supported data. Filters for ratings, availability and price return no false data; release them only once those attributes exist. Typos/synonyms/facets require a search-acceptance spike and potentially dedicated search provider.

## 3. Phase 1 CMS functions

| Function | Authorized caller | Purpose / guards |
|---|---|---|
| `content:saveDraft` / `content:requestReview` | CMS editor/admin | Validate fields and slug; record actor/time; prevent unauthorized publish |
| `content:publish` / `content:unpublish` | CMS publisher/admin | Ensure approved content, review claims, invalidate public cache/index as needed |
| `professionals:upsertCuratedDraft` | CMS admin/authorized curator | Validate source approval and service-jurisdiction mapping; no invented verified status |
| `professionals:setPublication` | CMS admin | Publication, suspension and review with audit event |
| `taxonomy:manageCountry` / `taxonomy:manageServices` | CMS admin | Country enablement changes require approved activation checklist |
| `media:requestUpload` / `media:completeUpload` | Authorized CMS staff | Validate bucket, MIME/size, purpose and object; on completion write metadata only after verification |
| `media:approvePublicAsset` / `media:removeAsset` | Authorized CMS staff | Only safe approved files become public; protect referenced files from unsafe deletion |
| `contact:submit` | Public (rate-limited) | Contact/professional-interest **only**, no transactional lead/quote flow; validate and store; return safe receipt ID |
| `contact:list` / `contact:updateStatus` | Authorized staff | Read/update only permitted records; avoid PII in logs |
| `audit:listForResource` | Privileged staff | Filtered audit records; export restriction and self-audit |

### Request/response conventions

- Public search request: normalized filters + cursor; response contains `results` (approved directory cards), `nextCursor` and `hasMore` or equivalent consistent pagination state.
- Mutation success: resource identifier and current state; no silent “success” until Convex committed and any required external status known.
- Public form success: `receiptId`, `status=received`; email delivery can be asynchronous and must not falsely claim successful delivery.
- Validation: per-field error map; all errors safe for display; no stack traces in responses.

## 4. Better Auth HTTP boundary

- **`/api/auth/[...all]`** — provider's documented GET/POST handler/proxy to the Convex-backed Better Auth service. No custom password/session storage; verify same-origin, correct production URLs, CSRF/cookie settings and protected redirect allowlists.
- Phase 1 staff login via explicitly provisioned identities. Phase 2 public registration, password recovery, MFA, organization membership and session lifecycle.
- Cookies/session secrets stay server-side and in secure cookies; no tokens in query strings, analytics or logs.
- Server functions call validated identity/role lookup on every restricted operation; an authenticated identity with no app permission is denied.

## 5. R2 upload/download protocol

1. Authenticated caller requests upload intent with declared purpose, allowed type and size.
2. Convex/authorized server verifies actor, related resource, bucket classification and abuse limits, then issues short-lived purpose-scoped PUT URL or official R2 component upload handle.
3. Browser transfers bytes **directly to R2**; CORS restricted to approved origins and required methods/headers.
4. Server checks R2 object and metadata before marking upload complete; private tax/credential files remain inaccessible until required malware scan is clear.
5. Public approved assets receive an approved CDN URL; private files get short-lived signed GET after checking exact engagement or reviewer permissions.
6. Failed/orphaned object cleanup via scheduled/reconciliation process.

Secrets for signing never reach browser. Presigned URLs are bearer capabilities: restrict scope, expiry and disclosure.

## 6. Phase 2 application functions

| Function group | Access | Operations |
|---|---|---|
| `accounts:*` | User/staff as appropriate | Current user summary, preferences, export/deletion requests |
| `organizations:*` | Org members/owner | Create organization, invite member, revoke membership, update role (with owner permission) |
| `professionalOnboarding:*` | Professional/firm owner | Start, update, submit application, locations/services/credentials; deny unverified public claims |
| `verification:*` | Verification staff | Review queue, credential decision, expiry check, approve/suspend with reason/audit |
| `favorites:*`, `savedSearches:*` | Current user | Save/list/remove own favorites and searches |
| `notifications:*` | Current user | List/read own notifications and preferences |

Phase 2 route handlers should be limited to auth proxy and any third-party callback actually required. Do not add REST wrappers around all Convex mutations.

## 7. Phase 3 transactions and external APIs

| Group | Caller / effect | Key checks |
|---|---|---|
| `leads:create`, `leads:listMine`, `leads:updateStatus` | Customer or authorized professional | Service/jurisdiction eligibility, owner/member access, no exposure to unrelated firms |
| `quotes:create`, `quotes:send`, `quotes:accept` | Professional firm then customer | Accept only a sent unexpired quote; currency/amount immutable after acceptance |
| `appointments:request/confirm/reschedule/cancel` | Authorized parties | Timezone, buffers, collision/race check, cancellation policy |
| `messages:list/send` | Engagement participants | Membership guard per conversation, content bounds, spam/reporting policy |
| `documents:uploadIntent/downloadIntent` | Engagement parties | Private R2, scan clear, authorization and retention |
| `payments:createCheckout` | Authorized payer | Allowed country/currency/provider + current engagement/invoice amount |
| `payments:applyProviderEvent` | Internal webhook processor | Verified provider signature, event deduplication, state transition, ledger update |
| `refunds:request` | Authorized operator | Approved policy, provider processing, idempotency, no optimistic success |
| `support:create/updateCase` | Involved party/staff | Scope access and auditable decisions |

### Webhooks

Payment provider callback route **TBD after PSP approval** (illustrative `/api/webhooks/payment-provider`); accept only documented methods and signature headers. Verify raw request body/signature, reject replay, persist provider event ID before processing, implement idempotent retry and reconciliation. No redirect/client response is proof of payment.

Email provider inbound/status webhooks are **optional** and should be introduced only if delivery state is required. Validate signatures and never log message bodies containing sensitive data.

## 8. Phase 4 revenue functions

- `plans:listActive`, `subscriptions:begin/portal/status`, `leadCredits:purchase/spend/refund` (atomic guards with idempotency), `sponsorships:create/approve/list`, `finance:reconcile/export`, `moderation:review`.
- Paid placements must be labeled at the **response/view model** level and in rendered UI.
- Each paid/credited action writes an append-only event; provider invoices, refunds and payouts reconciled against internal ledger, not computed solely from client UI.

## 9. Phase 5 country activation and search scale

- `marketActivation:submitReview/approve/toggle` is restricted to approved operators and validates jurisdiction/legal/payment/operational checklists before enablement.
- Locale-aware content queries and translation review before indexing; explicit hreflang/canonical policies.
- If dedicated search provider is approved, `search:syncPublishedProfile` is internal and idempotent with reconciliation; public result projections still obey country/profile eligibility.

## 10. Rate limits, observability and failure behavior

| Surface | Protection |
|---|---|
| Search & anonymous listing | Bounded pagination, request throttling, reasonable query lengths, no enumeration of private rows |
| Public contact | Form token/anti-bot, per-IP/per-email adaptive throttles, bounded payload, server-side consent check |
| Better Auth | Provider-supported login limits, reset enumeration resistance, MFA and alert on spikes |
| R2 signing | Per-user quotas, MIME/size/content checks, short expiration, object cleanup |
| External email | Provider status stored, bounded retries for transient errors, no duplicate receipts if possible |
| Payment webhooks | Cryptographic verification, unique provider event IDs, idempotent state machine, alarm on backlog |
| Errors/logging | Correlation ID, code, phase, provider status; **never** token, credential, contact text, tax document or payment card info |

## 11. Required configuration variables (names to finalize against current SDK docs)

| Service | Configuration | Exposure |
|---|---|---|
| Convex | deployment reference and public client URL (`NEXT_PUBLIC_CONVEX_URL` or adapter equivalent), site URL | Public endpoint config only |
| Better Auth | `BETTER_AUTH_SECRET`, site/trusted origin, provider callback configuration | Server/Convex secrets only |
| Cloudflare deployment | Worker env and domain, CSP, allowed origins | Mostly server |
| R2 | account ID/endpoint, restricted access key and secret, bucket names, public media domain | Signing keys server/Convex only |
| PostHog | public project key and ingestion host | Public project key; no personal payloads |
| Email | provider API key, sender domain and admin recipient list | Server only |
| Payments (later) | provider secret keys, account IDs, webhook signing secret | Server only |

Values must be stored in appropriate provider secret stores, not git, frontend bundles, screenshots or prompt logs.

## 12. API acceptance checklist

- Public directory results match filters and never reveal drafts/unapproved data.
- All staff writes require authenticated role; all user/org data checks ownership.
- Rate-limited public forms behave safely and don't duplicate submissions.
- R2 private object access cannot be bypassed with guessed IDs/object keys.
- Later PSP webhook duplicates, bad signatures and unsupported-country events do not create false financial state.
- Error payloads are stable, typed, and contain no personal tax data.
