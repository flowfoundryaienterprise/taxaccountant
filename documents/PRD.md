# PRD.md — TaxAccountant.com Global Marketplace

**Status:** Draft for founder/client approval · **Version:** 1.0 · **Date:** 20 October 2026  
**Product:** TaxAccountant.com · **Implementation owner:** FlowFoundry AI Solutions  
**Primary source:** `TaxAccountant_Global_Marketplace_Development_Master_Plan.pdf` (7 pages). The earlier single-firm Phase 1 brief is superseded wherever scopes conflict.

## 1. Product statement

TaxAccountant.com is a **two-sided international marketplace**, not a single accounting firm's marketing website. Individuals and organizations will find relevant tax/accounting professionals; professionals will build trustworthy listings and acquire work; the operator will manage quality, marketplace operations, and later monetization. Delivery is intentionally staged into **five separately accepted phases**.

### Problem
- Customers cannot easily identify professionals qualified for their **tax jurisdiction**, language, service, and cross-border situation; a professional's location alone does not prove authorization.
- Comparing credibility, capabilities, price indications, and availability is difficult and inconsistent.
- Professionals need discoverability and eventually a secure route from enquiry to engagement.
- Operators need tools to publish accurate listings, enforce review policies, and control jurisdiction-specific availability.

### Value proposition
Search across countries and services, compare transparent profiles, understand verification status, and—after later phases—request quotes, book, collaborate securely, and pay where legally supported.

### Target users
| Audience | Primary need |
|---|---|
| Individual taxpayers / expatriates | Find jurisdiction-appropriate tax advice or preparation |
| Freelancers, SMEs, multinational businesses | Find bookkeeping, tax planning, payroll, international tax and related services |
| Tax/accounting professionals and firms | Publish qualifications and services, receive enquiries, handle engagements |
| Marketplace editorial staff | Curate accurate content, countries, categories and listings |
| Verification/operations staff | Review credentials, manage support and marketplace quality |
| Finance/platform administrators | Oversee subscription, marketplace fees, payouts, disputes and reporting in later phases |

### Product principles
1. **Jurisdiction before geography:** customer residence, applicable tax jurisdiction and professional authorization are distinct fields.
2. **Trust before scale:** no fake profiles, reviews, ratings, credentials, availability, prices or client counts.
3. **Public discovery first; transactions later:** a functional public directory precedes customer/professional accounts.
4. **Controlled country activation:** searchable coverage may be broader than countries enabled for enquiries, engagement or payment.
5. **Minimize sensitive information:** never ask for tax identifiers or tax documents through public forms; private document features start in Phase 3.

## 2. Outcome and measurement

**Phase 1 leading measures (definitions, not invented targets):** visits to directory, `search_started`, `filters_applied`, profile views, search-to-profile conversion, zero-result searches, contact/professional-interest completion, mobile performance and broken-link rate.

**Phase 2:** verified professional activation, approved profiles, onboarding completion, permission-test success.  
**Phase 3:** legitimate enquiries, quotes, booked engagements, completed eligible payments, refunds/disputes, lead-to-booking conversion.  
**Phase 4:** paying professional retention, subscription conversion, lead-credit revenue, fees reconciled, sponsored-label compliance.  
**Phase 5:** approved market activations, localization quality, performance, recovery objectives.

Numerical KPIs, target launch countries, growth assumptions, pricing and SLAs **require approval**.

## 3. Roadmap and release gates

| Phase | Planned delivery | Phase gate |
|---|---|---|
| **1 — Public marketplace & foundation** | Original responsive design; service/country/tax-jurisdiction taxonomy; CMS; public profile directory and detail pages; search/filter/sort; foundational international routes and SEO; analytics and cookie choices | Seeded searches work by country, jurisdiction and service. Mobile, forms, profiles and accessibility checks pass. |
| **2 — Accounts & verification** | Customer/business/professional/staff accounts, MFA, organization access, profile onboarding, credentials/R2 uploads, manual verification, dashboards, consent, notifications, export/deletion requests | No unapproved verified badges; cross-account authorization tests pass. |
| **3 — Transactions** | Enquiries, quotes, appointments, reminders, conversations, private files, engagements, invoices, approved-market payments/refunds/payouts, cases/disputes | Enquiry → engagement → eligible payment → receipt works; cancellation, refunds, failed payment and unsupported-country paths pass. |
| **4 — Revenue & operator tools** | Subscription plans, credits, commissions, sponsor listings, finance/reconciliation, review moderation, fraud signals, funnels | Every fee itemized/reconciled; sponsored placements labeled; admin controls tested. |
| **5 — Global scale** | Localization, country-specific enablement, improved matching, experiments, load/security/DR work and SEO scale | Country activation checklist plus approved reliability, recovery, translation and legal gates pass. |

**Approval boundary:** Only **Phase 1** is the initial MVP. Future-phase fields may be anticipated, but do not implement their features prematurely. Timeline estimates belong in `IMPLEMENTATION_PLAN.md`, not product commitments.

## 4. Phase 1 — Detailed functional scope

### Public discovery
**P1-F01 Homepage.** Country + service search, service category tiles, how it works, coverage, approved credibility evidence, educational content, professional-interest CTA. Featured profiles appear only when approved and actually eligible for display. No fabricated testimonials.

**P1-F02 Professional directory.** Keyword search; country, city when supported, **tax jurisdiction**, service and language filters; credentials and remote/in-person filters when validated data exists; sorting and cursor pagination. Price/rating/availability filters only if verified production data supports them; otherwise hide or show clearly unavailable, never manufacture data. Empty results offer a clear-filter option. Optional map is not an MVP gate.

**P1-F03 Public profiles.** Stable, unique SEO-friendly URLs; professional/firm name, approved biography, locations, services, qualifications with honest status, jurisdictions of authorization, languages, remote service indication, and safe public contact/action. Unknown credentials must not appear as “verified.” Booking/quote CTAs are **not active** until Phase 3; before then point to valid explanatory/contact routes.

**P1-F04 Country/service taxonomy.** Country and tax jurisdiction stored separately, countries can be `discoverable`, `onboardingEnabled`, `transactionEnabled`, `paymentEnabled` independently. Country pages summarize approved service coverage and applicable jurisdiction disclaimers; city pages only where real content exists.

**P1-F05 Service and resource pages.** Individual tax, business tax, international tax, bookkeeping, payroll, tax planning, audits/support, entity formation, amended returns as **proposed categories subject to approval**. CMS-managed educational guides, blog/glossary entries and disclaimers; country-specific tax facts require qualified editorial review.

**P1-F06 Public trust and utility pages.** About, How It Works, For Professionals, Contact, Help/FAQ, Privacy, Terms, cookie preferences, and informative 404. Pricing and dispute/refund policy pages can be informative/placeholder only until business rules approved; do not publish invented policies.

**P1-F07 CMS.** Privileged staff can create/edit/preview/publish/unpublish pages, resources, country summaries, categories, menus, media and curated profiles, with audit events. Phase 1 needs **minimal staff authentication** to secure the CMS; expanded account/role system and MFA are a Phase 2 milestone (see approval decision A-03).

**P1-F08 Contact and professional-interest forms.** Name, email, optional phone, subject/category, message and privacy acknowledgment; server validation, spam/rate controls, receipt/notification if configured. These are **nontransactional interest/contact** forms, not quote placement, lead resale or booking. Do not collect tax IDs or documents.

**P1-F09 International SEO and analytics.** Canonicals, per-page metadata, OG images, sitemap, robots, breadcrumbs, correct structured data only, relevant country URLs, consent-aware PostHog events; Search Console verification. No duplicate/thin auto-generated country/city pages.

**P1-F10 Content/publication controls.** Draft → review → published → archived; country activation checked at every public display/CTA; no unpublished/unapproved profiles in indexed routes. Seed data used in development/staging must not pass as real production listings.

### Phase 1 minimum journeys
1. Visitor selects country + service → filters directory → opens a matching, published professional profile → proceeds to a valid current-stage CTA.
2. Visitor changes tax jurisdiction independently of country → sees only relevant eligible listings or a helpful no-results screen.
3. Editor creates a country/service page → previews it → authorized publisher approves/publishes → public SSR page and sitemap update.
4. Operator imports curated profile data → marks required verification as reviewed (or keeps unverified) → makes an authorized profile public.
5. Visitor submits public contact/professional-interest form → gets acknowledgment → authorized staff can manage the submission.
6. Visitor rejects analytics cookies → non-essential tracking stays disabled as applicable.

### Phase 1 user stories and acceptance
| Story | Acceptance |
|---|---|
| As a visitor I can search for a professional by **tax jurisdiction**, not only location. | State preserved in URL; results reflect approved service/jurisdiction links. |
| As a visitor I can compare search results without being misled. | No fabricated ratings, prices, availability or verification. |
| As an editor I can maintain country, service and resource content. | Drafts not public; preview only authorized; audit records created. |
| As an operator I can disable a country's transaction functionality. | All gated CTAs unavailable for that country even via direct links. |
| As a mobile visitor I can search and navigate. | Forms/menus keyboard and screen-reader usable. |
| As a visitor I can submit an interest form. | Input validated, stored, rate-controlled, acknowledgment shown, no tax data requested. |

## 5. Phases 2–5 — Functional scope

### Phase 2 accounts and verification
- Better Auth signup/login/logout, recovery and MFA; customer, business, professional, firm member and staff identities.
- Organization membership and roles; users can have business accounts as well as personal identities.
- Professional onboarding with business identity, jurisdiction licenses, credentials, offices/services/languages and optional team.
- Private R2 upload of credentials with review status, expiry, staff approval/rejection/suspension, audit history; only approved statuses drive visible badges.
- Customer saved professionals/searches, preferences and dashboards; professional editable profiles and basic lead-readiness dashboard; staff review queues; consent updates, notification preferences, export/deletion request intake.

### Phase 3 marketplace transactions
- Customer submits jurisdiction-specific enquiry; assigned/eligible professional receives it; proposal/quote creation, comparison and acceptance.
- Appointments with timezone, buffers, reminders, rescheduling/cancellation and accurate availability (no fabricated slots).
- Per-engagement conversations; protected R2 documents with malware scanning, authorization and short-lived signed URLs; retention/deletion policy.
- Engagement milestones; approved-country PSP checkout and marketplace seller onboarding; invoices, provider webhooks, reconciliation, refunds, disputes and support cases.
- Unsupported-country journeys remain enquiry-only or disabled, as legally approved; no payments/payouts where not supported.

### Phase 4 revenue and operator tools
- Configurable subscription tiers, billing cycles/trials/cancellations, professional lead credits, paid promotions and commissions.
- Append-only money/credit ledger, idempotent provider events, account reconciliation, finance exports, payout administration and refunds.
- Sponsored ranks always labeled; review moderation and anti-fraud workflows with audit trail; operator reports and funnel/cohort insights.

### Phase 5 country scale and performance
- Language localization and currency display appropriate to market; jurisdiction-aware content ownership and translation review.
- Activate countries only after legal, credential, support, privacy, tax and payment checks.
- Search index/relevance enhancements, ranking evaluation, controlled experimentation, load testing, recovery exercises, large-scale SEO controls.

## 6. Pages and screens by release

| Phase | Routes/screens (illustrative; paths to approve) |
|---|---|
| 1 | `/`, `/find-accountant`, `/professionals/[slug]`, `/services`, `/services/[slug]`, `/countries`, `/countries/[code]`, optional approved `/countries/[code]/[city]`, `/how-it-works`, `/for-professionals`, `/resources`, `/resources/[slug]`, `/about`, `/contact`, `/help`, `/faq`, `/privacy`, `/terms`, `/admin/*` CMS |
| 2 | `/sign-in`, `/sign-up`, `/account/*`, `/professional/onboarding`, `/professional/dashboard/*`, `/organization/*`, `/admin/verification/*` |
| 3 | `/requests/*`, `/quotes/*`, `/bookings/*`, `/engagements/*`, `/messages/*`, `/payments/*`, `/support/*` |
| 4 | `/professional/billing/*`, `/professional/promotions/*`, `/admin/finance/*`, `/admin/moderation/*` |
| 5 | Locale-aware route prefixes (format TBD) and controlled country expansions |

## 7. Roles and permissions

| Role | Read/manage scope |
|---|---|
| Anonymous visitor | Published, authorized public content and approved listings only; nontransactional contact |
| Phase 1 CMS Administrator | CMS/configuration, curated public profiles, country availability and audit review |
| Phase 1 CMS Editor | Approved content areas only; no user/credential/billing management |
| Customer | Own identity, favorites, enquiries, bookings, engagements, messages, documents, payments as phases unlock |
| Organization owner/member | Explicitly authorized organization records based on membership and role |
| Professional / firm owner/member | Own firm profile, services, leads, bookings, messages, engagements and billing as unlocked |
| Verification operator | Assigned credential/profile review and restricted audit views |
| Support / finance staff | Only assigned support and finance actions; sensitive access logged |
| Platform administrator | Operational management under least privilege; no implicit permission to expose tax documents |

Staff role taxonomy and separation of duties are **approval decisions**. Authentication never substitutes for resource-level authorization.

## 8. Data requirements

- Country code, locale, languages, currency display and launch flags; tax jurisdiction code and legal context separate from physical location.
- Professional listing with canonical slug, firm/person status, eligibility, published state, offices, services, country/jurisdiction coverage, verified facts and contact policy.
- CMS pages/resources with editorial lifecycle, SEO fields, author/reviewer and revisions or audit trail.
- Auth-linked users and organizations (Phase 2), provider/credentials and review events (Phase 2), marketplace engagement/payment records (Phases 3–4).
- R2 stores file objects; Convex stores only object key, bucket/classification, owner, scan state, alt text and metadata. Sensitive documents are never public.
- Aggregate analytics, not personal tax details, goes to PostHog.

The detailed phased schema is in `DATABASE.md`.

## 9. Non-functional requirements

- **Accessibility:** WCAG 2.2 AA target, keyboard navigation, focus, labeled forms, screen reader feedback.
- **Responsive:** phone, tablet, desktop and large desktop. Major templates tested in current browsers.
- **SEO:** SSR/prerender indexable pages, canonical/hreflang when correct, sitemap with published permitted URLs only, crawl control, truthful structured data.
- **Security:** TLS, sessions, MFA for appropriate staff/Phase 2, least-privilege Convex authorization, rate controls, private R2, monitoring and audit events.
- **Privacy:** explicit consent policy; data minimization, retention/deletion review, regional privacy/processor impact assessment before activation.
- **Performance:** measure p75 mobile/desktop Core Web Vitals and search response with realistic data; proposed starting targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 for approval.
- **Reliability:** separate dev/staging/prod, documented build, health and deploy checks, export/backup and restore exercise, rollback.
- **International safety:** country rules checked on every protected action, not merely hidden frontend buttons.
- **Financial integrity (Phase 3+):** idempotent webhooks, no duplicate charges, precise minor-unit accounting and reconciliation.

## 10. Loading, empty, success and error states

| Surface | Required states |
|---|---|
| Directory | Loading skeleton, results, no-results + clear filters, search temporarily unavailable, retry |
| Profile | Image fallback, unknown fact omitted, not-found/unpublished, temporarily unavailable |
| CMS editor | Unsaved edits, saving, save success, conflict/stale edit, validation, denied permissions |
| Forms | Required field errors, submitting, duplicate/rate-limited, success receipt, failed send with safe retry |
| Accounts | Signed out, MFA step, expired session, forbidden resource, account recovery |
| Bookings/payments | Pending, confirmed, failed, canceled, refunded or provider delayed without optimistic false confirmation |
| R2 upload | Upload progress, type/size rejected, failed, security scan pending, available after validation |

## 11. Integrations and boundaries

- **Approved technical direction (requested):** Next.js/TypeScript/Tailwind; Cloudflare Workers (full-stack deployment), Convex database/backend, Better Auth via Convex integration, Cloudflare R2 media/documents, PostHog product analytics.
- **Needed but not yet chosen:** transactional email provider; payment/marketplace PSP; malware scanning; possibly an external search engine if typo tolerance/faceting benchmarks exceed Convex native search; Google Search Console domain control; calendar/video integrations when required.
- **Approval warning:** the source master plan proposes PostgreSQL/external search/other auth generically. Convex + Better Auth is a requested alternative, **not automatically client-approved**.

## 12. Out of scope for Phase 1

Customer/professional self-service accounts, marketplace quotes/bookings/messaging, private tax documents, payouts, payment gateways, reviews, paid credits, subscriptions, sponsored results, automated credential verification, AI tax advice, tax filing/calculations, automatic country-wide service activation, and built-in translation engines.

## 13. Critical approvals / open questions

| ID | Requires approval before |
|---|---|
| A-01 | **First countries**, discoverable vs active service jurisdictions, allowed designations and license-review criteria — before real profile publication |
| A-02 | Convex in place of PostgreSQL, native vs external search, and Cloudflare Workers compatibility — before architecture freeze |
| A-03 | Minimum staff authentication in Phase 1 CMS despite broader staff authentication appearing in Phase 2 — before CMS release |
| A-04 | Production professional data sources, published profile consent and ownership — before indexing |
| A-05 | Brand/logo, exact page copy, trust claims, legal text, disclosure/consent and image licenses — before launch |
| A-06 | Contact form purpose, retention, email provider and operator recipients — before opening forms |
| A-07 | Currency/price presentation, ranking/sponsorship principles — before exposing such filters |
| A-08 | Payment markets/provider, refund/dispute rules, KYC/KYB and jurisdiction counsel — before Phase 3 payments |
| A-09 | Subscription fees, lead economics, commission model — before Phase 4 |
| A-10 | SLO/RTO/RPO and scale targets — before Phase 5 activation |

**Approval rule:** If a blocking decision is unknown, develop behind a disabled feature flag with approved test data; do not publish invented claims or turn it on in production.
