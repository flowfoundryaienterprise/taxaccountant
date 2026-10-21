# IMPLEMENTATION_PLAN.md — TaxAccountant.com Delivery Roadmap

**Status:** Technical plan to be revised at every signed phase gate. Owner: solo full-stack developer (FlowFoundry AI Solutions). No application code is supplied here.

## 1. Delivery assumptions and durations

| Phase | Planning baseline | Range to revisit | Completion definition |
|---|---:|---:|---|
| 1. Public marketplace | **4 weeks / 28 calendar days** | 4–6 weeks | Searchable indexed curated profiles, country/service taxonomy, public pages and minimal secure CMS |
| 2. Accounts & verification | **5 weeks** | 4–6 weeks | MFA, account/org management, reviewable verified listings, protected dashboards |
| 3. Marketplace transactions | **10 weeks** | 8–12+ weeks | Quotes, booking, messages/private docs, approved-market payments/refunds end-to-end |
| 4. Revenue/operator tools | **6 weeks** | 5–8 weeks | Subscriptions, credits, commissions, sponsored labels, ledger/reconciliation |
| 5. International scale | **12 weeks** | 8–16+ weeks | Approved-country expansion, i18n, compliance, tested SLOs/DR |

**Combined planning baseline: ~37 weeks** for one developer, excluding waiting on legal approvals, content availability and external payment/KYC decisions. This is not a fixed-price or guaranteed commitment. Do not claim 28 days includes all marketplace phases.

### Blocking prerequisites
- Owner approves `PRD.md` scope, light-blue design direction and country/service list.
- Client approves Convex replacement for generic PostgreSQL recommendation and validates search solution.
- Acquire approved domain, Cloudflare, Convex, Better Auth, R2, PostHog accounts and permissions. Do not assume services/keys exist.
- Legal/business reviewers provide approved profile sources, disclaimers and activation constraints.

## 2. Phase 1 — 28-day implementation checklist

Each day contains **frontend (FE)**, **Convex/backend (BE)**, **data/storage (DB)** and **verification (QA)**. Keep the whole application buildable each day. Days reflect a working plan, not an inflexible sequence if external approvals are late.

| Day | Goal and tasks | Likely modules/files | Prerequisite | Done when |
|---|---|---|---|---|
| **1** | **FE:** scaffold Next.js App Router + Tailwind. **BE:** initialize Convex and Cloudflare Worker build. **DB:** dev deployment and empty schema. **QA:** local + deployed Hello World, SSR smoke. | `app/`, `convex/`, Worker config, scripts | Cloudflare/Convex access | Local and Worker deployment run with no exposed secrets |
| **2** | **FE:** app shell and auth status test route. **BE:** integrate Better Auth/Convex test admin and logout. **DB:** auth component and temporary restricted staff mapping. **QA:** deployed session/cookie reload, forbidden query. | auth helpers, route, `convex/auth*` | Day 1 | Staff identity works on Worker; deny unauthenticated access |
| **3** | **FE:** directory filter prototype. **BE:** compare native Convex search/indexes against typo/facet/filter needs. **DB:** realistic test fixture countries, jurisdictions/services/profiles. **QA:** record latency, pagination and feature gaps. | search spike, schema/fixtures | Search criteria approved | Decision: Convex-native accepted or external index approval request |
| **4** | **FE:** color/typography tokens, header/footer, nav. **BE:** public content query stubs. **DB:** `countries`, `taxJurisdictions`, `serviceCategories`, `languages`. **QA:** contrast and keyboard navigation. | `components/layout`, design tokens, `convex/taxonomy` | Brand/country proposal | Shared shell and taxonomy retrieval work |
| **5** | **FE:** desktop/mobile homepage/search mockup. **BE:** public query contracts. **DB:** `professionals`, `professionalServices`, locations/languages. **QA:** approve design and data relationship proof. | homepage, `convex/professionals` | Source listing approval | Responsive approved homepage direction and validated relations |
| **6** | **FE:** directory/profile mobile/desktop layouts. **BE:** content publish rules and staff role guard. **DB:** `contentPages`, media metadata, `auditEvents`. **QA:** drafts cannot leak in public read. | directory/profile views, `convex/content` | Staff identity | Key templates approved; publication contract works |
| **7** | **FE:** final design handoff and component states. **BE:** staging deploy end-to-end baseline. **DB:** versioned seed scripts (staging test only). **QA:** review week-1 blockers. | docs, tests, CI | Days 1–6 | Design/architecture approval gate |
| **8** | **FE:** polished homepage sections and search entry. **BE:** published country/service/featured profile queries. **DB:** approved homepage and service content. **QA:** navigation and missing-data state. | home components, public queries | Design approval | Homepage SSR contains real approved or empty sections |
| **9** | **FE:** filters/search results UI, URL state. **BE:** directory query and cursor pagination. **DB:** search/filter indexes. **QA:** combinations and no-results behavior. | `/find-accountant`, `convex/search` | Day 3 search decision | Cross-country search returns correct data |
| **10** | **FE:** professional card and detail template. **BE:** slug query, public projection and eligibility. **DB:** profile slug and service relations. **QA:** guessed draft profile URL returns not-found. | `/professionals/[slug]` | Approved profile data | Stable shareable profiles with accurate status |
| **11** | **FE:** services index and detail layouts. **BE:** service/country content routing. **DB:** service pages, editorial fields. **QA:** taxonomy links and breadcrumb tests. | `/services/*` | Approved taxonomy | All approved service routes render |
| **12** | **FE:** countries directory/country detail and optional approved city template. **BE:** country availability flags and safe country DTO. **DB:** jurisdiction/country indexes. **QA:** country and tax jurisdiction stay distinct. | `/countries/*`, filters | First active/discoverable countries | Country pages have truthful coverage and flags |
| **13** | **FE:** Resources, About, How It Works, FAQ, Help, For Professionals. **BE:** content queries. **DB:** editorial drafts, categories. **QA:** policy/copy sign-off and headings. | marketing routes, `convex/content` | Client copy/rights | No fabricated or broken resource content |
| **14** | **FE:** Contact and professional-interest forms + privacy/terms/cookie choices. **BE:** anti-spam mutation and optional email action. **DB:** `publicMessages`, `siteSettings`. **QA:** valid/invalid/rate/consent forms. | forms, `convex/contact` | Email/retention approval | Public form stored safely; receipt accurate |
| **15** | **FE:** CMS dashboard shell/listing. **BE:** role-based CMS read/write. **DB:** `staffMemberships`, audit indexes. **QA:** CMS editor/admin negative access matrix. | `/admin/*`, `convex/staff` | Staff CMS auth decision | Restricted staff screens/data correct |
| **16** | **FE:** CMS page editor, preview/status. **BE:** save/request-review/publish mutations. **DB:** publish metadata/locks. **QA:** draft/preview/public transitions. | CMS content editor | Day 15 | No draft exposure; audit trail |
| **17** | **FE:** resource/blog editor, categories. **BE:** rich text sanitization, SEO validation. **DB:** content categories join. **QA:** unsafe markup and duplicate slug tests. | CMS resources | Content model | Resource publishing is safe and works |
| **18** | **FE:** professional curator editor. **BE:** profile/service/jurisdiction edits with source approval. **DB:** credentials public status and mappings. **QA:** fake verified state blocked. | admin professionals | Profile policy approved | Curated profiles published only after approval |
| **19** | **FE:** country/service management screens. **BE:** activation guards and taxonomy mutation. **DB:** status/activation indexes. **QA:** disabled-country CTA/direct link cannot transact. | admin taxonomy | Country policy | Editing cannot bypass activation checks |
| **20** | **FE:** media picker/upload and alt text. **BE:** R2 signing permissions and complete-upload verification. **DB:** `mediaAssets` metadata. **QA:** wrong MIME, oversize, unauthorized access, orphan failure. | admin media, R2 integration | R2 accounts/CORS | Approved media publish, private never public |
| **21** | **FE:** admin public messages inbox. **BE:** status notes/assignment if approved, notification action. **DB:** publicMessages queries + audit. **QA:** PII access, email failure and retries. | admin messages, email | Staff recipients approved | Nontransactional messages managed and protected |
| **22** | **FE:** SEO heading/image fixes. **BE:** canonical/robots/sitemap/structured-data generation. **DB:** published/locale lookup indexes. **QA:** verify server HTML/canonical/test sitemap. | metadata/SEO routes | Public pages stable | Published permitted URLs indexable |
| **23** | **FE:** cookie control and consent-aware PostHog events. **BE:** analytics event guard; optional Search Console verification. **DB:** site consent configuration. **QA:** deny consent = no optional capture, no PII. | analytics, cookie components | Legal consent wording | Event instrumentation and privacy tests pass |
| **24** | **FE:** accessibility and keyboard fixes. **BE:** audit input/security/rate controls. **DB:** permission/index integrity checks. **QA:** automated + manual WCAG checks and OWASP abuse tests. | app-wide, tests | MVP flows complete | No critical security/accessibility issues |
| **25** | **FE:** image/font/mobile/Core Web Vitals optimizations. **BE:** query/cache improvements, error handling. **DB:** index tuning based on observed queries. **QA:** mobile/desktop performance checks. | performance, queries | Trace data available | Meets agreed thresholds or logs accepted gap |
| **26** | **FE:** cross-browser journeys and empty/error states. **BE:** end-to-end and reliability bug fixes. **DB:** Convex/R2 export+restore dry run. **QA:** full acceptance matrix, regression suite. | tests/runbooks | Staging ready | All P1 business critical tests pass |
| **27** | **FE:** staging UAT fixes only. **BE:** deployed auth, Worker and SEO validation; rollback rehearsal. **DB:** release schema/seed audit. **QA:** client walkthrough and signed UAT issues. | CI/Worker/staging | Stakeholder available | Written phase gate approval or blocker list |
| **28** | **FE:** production smoke and redirects. **BE:** deploy Worker+Convex, monitor errors, finalize docs. **DB:** production indexes, backups, R2 ACL verification. **QA:** smoke, rollback ready, handover. | production config, runbooks | Signed approval | Controlled public marketplace foundation launched |

### Phase 1 exit checklist
- [ ] Approved visual system and copy; actual source-approved public professionals only.
- [ ] Search by country + **tax jurisdiction** + service + filter/sort passes seeded test cases; relevance limitations documented.
- [ ] CMS staff access secured; unapproved/draft documents not public.
- [ ] Profile and country/service/resource URLs SEO-rendered; sitemap/canonical/robots correct.
- [ ] Contact/interest forms work with privacy and bot safeguards (no transactional lead/quote claim).
- [ ] R2 public/private boundary and upload validation tested.
- [ ] Accessibility, production Worker/auth test, backup restore and UAT signed off.

## 3. Phase 2 — Five weekly milestones

| Week | Goal and tasks | Likely modules / data | Test and acceptance |
|---|---|---|---|
| **P2-W1** | Customer/professional signup/login recovery, MFA and session handling; staff permissions expanded. | auth routes/helpers, `appUsers`, `staffMemberships` | MFA/session, auth edge cases, denial without verified identity |
| **P2-W2** | Organizations and firm/team memberships; professional profile ownership and onboarding wizard. | `organizations`, `organizationMembers`, `professionalOwnership`, forms | Cross-org isolation, owner revoke, duplicate claims |
| **P2-W3** | Credential/identity submission and private R2 evidence; manual review and expiry. | `credentialSubmissions`, `verificationChecks`, R2 private | Only reviewed approved status creates badge; files never public |
| **P2-W4** | Customer/professional/admin dashboards, favorites, saved searches, notification preferences. | `favorites`, `savedSearches`, `notifications` | Per-user ownership, empty/loading/error, responsive workflows |
| **P2-W5** | Consent, export/deletion request handling, security regression, stakeholder UAT and release. | `consentRecords`, `privacyRequests`, scripts | Account rights process, MFA and permission matrix accepted |

## 4. Phase 3 — Ten weekly milestones

| Week | Goal and tasks | Data / integration | Completion test |
|---|---|---|---|
| **P3-W1** | Agree enquiry/quote/engagement states and supported jurisdictions. | country gates, `leads` | Unsupported countries denied/handled as approved |
| **P3-W2** | Enquiry submission, professional lead inbox and role access. | leads, notifications | Proper routing; no cross-firm leakage |
| **P3-W3** | Professional quotes, customer comparison and acceptance. | `quotes`, engagement creation | Quote immutable after acceptance; expiry behavior |
| **P3-W4** | Availability rules and appointment request/confirmation. | availability slots, appointments | Timezones, overlap/race, cancellations |
| **P3-W5** | Calendar/video provider integration if approved; reminders and rescheduling. | provider secrets, scheduled actions | Provider failures and retries visible |
| **P3-W6** | Engagement workspace and private threaded messaging. | engagements, conversations, messages | Participants only, spam and error handling |
| **P3-W7** | R2 private document flows, malware scanning, retention and signed access. | documents, R2 + scanner | Unauthorized IDs cannot reveal files; pending scan blocks access |
| **P3-W8** | Eligible-market PSP onboarding, checkout and invoices. | providerAccounts, invoices, payments | Signature checks; no payments in unsupported countries |
| **P3-W9** | Refunds, payout states, webhook retries, support and disputes. | refunds, payouts, providerEvents, support | Failed payment/refund/duplicate event/reconciliation tests |
| **P3-W10** | Complete end-to-end + penetration/privacy/UAT and controlled launch. | monitoring/runbooks | Enquiry → work → payment → receipt proven in approved test market |

**Gate:** If payment-country/provider terms remain unapproved, do not launch payment flows; isolate the rest and request an explicit reduced Phase 3 acceptance change.

## 5. Phase 4 — Six weekly milestones

| Week | Goal | Evidence |
|---|---|---|
| **P4-W1** | Confirm pricing, supported plans, country limits, subscription lifecycle. | Signed pricing matrix and sandbox billing tests |
| **P4-W2** | Professional subscription/upgrade/cancel/customer portal. | Provider event → subscription record reconciles |
| **P4-W3** | Lead-credit purchase/spend/refund with atomic and deduped ledger. | Concurrency/negative-balance/duplicate-event tests |
| **P4-W4** | Sponsored listing inventory and visibly labeled rank placement. | Sponsored label shown in all search experiences |
| **P4-W5** | Commission/fee reporting, refund and payout reconciliation, admin finance. | Every fee itemized, figures trace to provider |
| **P4-W6** | Moderation, fraud signals, funnel analytics, QA/UAT. | Role tests, dispute and finance approval gate |

## 6. Phase 5 — Twelve weekly milestones

| Weeks | Goal | Acceptance |
|---|---|---|
| **P5-W1–2** | Country activation/legal checklist and service/credential policy per target market | Counsel/operator sign-off, no unsupported regulated flows |
| **P5-W3–4** | Locale/translation infrastructure, editorial workflow, currency/timezone formatting | QA with approved translations and fallback |
| **P5-W5–6** | Country/city SEO scaling, hreflang/canonical and editorial review | Valid sitemaps/no thin duplicate pages |
| **P5-W7–8** | Search relevance, optional external indexing, synonyms/facets and quality monitoring | Agreed relevance/filter/country isolation benchmarks |
| **P5-W9** | Operator experiments/recommendations only if privacy review approved | Feature-flagged, measured, reversible |
| **P5-W10** | Load and availability monitoring, alert thresholds and performance tuning | SLO tests at approved traffic assumptions |
| **P5-W11** | Disaster recovery, backup and restore, security/privacy scan | Demonstrated RTO/RPO and incident runbooks |
| **P5-W12** | Country-by-country gated rollout, UAT and operational handover | Activation checklist signed for every market |

## 7. Implementation sequencing and dependency map

- Phase 1 geography/taxonomy and professional schema → Phase 2 verification → Phase 3 eligible matching and engagement → Phase 4 charged leads/subscriptions → Phase 5 international expansion.
- CMS and server-side public SEO must exist before large-scale content campaigns.
- Better Auth minimal privileged CMS access required before staff mutations; broader role system waits Phase 2.
- R2 public media in Phase 1 → secure R2 private credentials in Phase 2 → private tax documents in Phase 3 with malware scanning/legal policy.
- No PSP code or financial ledger before Phase 3 country/provider legal approval; no paid professional ranking before Phase 4 revenue approval.

## 8. Definition of done for each task

- Acceptance scenario documented; all intended states implemented (loading/empty/error where relevant).
- Authorization/validation and migration/index impacts reviewed; no unrelated changes.
- Unit/integration test for core logic and relevant negative case; E2E route where business critical.
- Lint, typecheck, relevant tests and production-compatible Worker build results documented.
- No secrets/PII leaked, no invented content; status and pending approvals reported.

## 9. Recommended first task

**Task P1-D01: Create the repository and an end-to-end proof of concept of Next.js App Router deployed to Cloudflare Workers (vinext) calling one public Convex query.** Then proceed immediately to **P1-D02: Better Auth-backed staff session** and **P1-D03: search capability proof**. These three tasks remove the largest architecture uncertainties before building the frontend.
