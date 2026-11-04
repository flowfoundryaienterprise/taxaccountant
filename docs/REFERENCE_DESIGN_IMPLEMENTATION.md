# Reference implementation report — 4 November 2026

## Visual gap analysis and public website

The reference has a compact white header, full-width pale-blue hero with an angled professional photograph, four-column information strip, eight service cards, pale-blue portrait grid, three steps, three equal editorial cards and navy footer. The old page had a framed image, extra worldwide sections, tall portraits, four steps, unequal article columns and a light footer.

The homepage now follows the reference composition and navy/blue tokens, with Inter typography, outline icons and tighter spacing. Existing logo, buttons, navigation, containers and route components were reused. Added licensed Gustavo Fring / Pexels hero photography; attribution is in public/images/ATTRIBUTIONS.md. The photography is similar in subject but is not the reference photograph. Two existing example portraits are absent. No pixel-perfect claim is made.

Homepage was rendered at 375, 768, 1024 and 1440 pixels without horizontal document overflow. Mobile menu open/Escape-close behavior was checked. Desktop/mobile full-page screenshots and desktop hero screenshot are in docs/qa/reference-design. Eight contrast checks passed in the first stage.

Development examples are labeled. Production builds now omit directory fixtures, their detail pages, and homepage examples. Production homepage, directory and profile pages now read approved USA listings from an explicit public Convex projection. Private onboarding drafts and review feedback are excluded. Development fixtures remain labeled and noindex. Public search is bounded to the latest 100 publication candidates; individual profile pages read the complete active offering list. No fictional verification or numeric trust claims were added.

## Authentication and onboarding

Implemented shared /login and /signup screens; /sign-in redirects to those routes. Customer and provider registration share Better Auth email/password. Only the initial public account type is selected by the registrant. Existing roles cannot be overwritten. Session-derived Convex accountDestination chooses the dashboard, prioritizing active staff membership. The first-admin bootstrap is internal-only; public signup cannot create a CMS administrator.

Professional onboarding has nine persisted steps, validation, Back/Next, Save draft, JPG/PNG photo upload, credential and service selection, USA jurisdiction checks, biography and final review. Creating the practice and initial draft is transactional and resumes an existing owned draft. Submission persists the profile and moves it to review; it never approves or verifies it. Submitted or published profiles can be withdrawn to draft for editing. Administrator change requests are saved as review feedback.

Existing claim-search and legacy onboarding components/taxonomy were preserved and included as dependencies of /professional/claim. The unrelated planning-document edit remains uncommitted.

## Customer and professional dashboards

Shared navy sidebar, pale-blue canvas, white cards and compact controls. Added a native mobile dialog drawer. Server gates check active accounts and role. Providers with no submitted/completed profile go to onboarding. /professional/profile reads only profiles belonging to the caller's active authorized firms.

The private enquiry inbox and submission form use real Convex contracts. Only approved published USA professionals with enabled matching services and jurisdictions accept enquiries. Customers see only their own submissions; authorized provider firm members see that provider's enquiries. Customer cancel and provider close actions persist actual status. Lists are bounded to 100 records and the limit is disclosed. No quotes, payment transfers or simulated submissions were added.

Saved profiles, notification feeds and account settings remain unavailable rather than showing fake data. Customer open-enquiry counts and professional new-lead counts come from their latest 100 authorized records. Provider completion and review status come from persisted onboarding.

## Administrator dashboard and review

Refined the reference layout: compact toolbar, narrow navy sidebar, outlined KPI icons, blue selected tabs, bordered quick actions and pale-blue checklist. /admin/dashboard aliases the existing protected overview. Add Professional is visibly disabled.

The overview now reads authorized live counts for approved published profiles, pending applications, new professional enquiries and active Stripe subscribers. Each count is bounded and displays 100+ above 100. The overview uses the actual application queue and latest enquiries; CMS drafts remain authorized reads. The checklist is a visual reminder, not saved review completion.

Added /admin/enquiries for the latest authorized enquiry records and /admin/applications for actual applications, with pending/published/draft tabs, profile biography, photo, credential records, services/jurisdictions and audited publication/change-request actions. Both the route and Convex functions require cms_admin for these reviews. Editors cannot approve profiles. The overview's review quick action opens this screen. Existing CMS screens remain available.

## Billing and backend integration

Preserved existing organization-authorized Stripe checkout and portal contracts, signed webhook processing and webhook-derived subscription status. Added configured-origin validation for checkout/portal return URLs. No live charge or checkout was performed; successful browser redirects are not payment proof. Stripe prices, keys, webhook configuration and SITE_URL must be configured by the operator.

New source includes optional onboarding fields and a leads table, with identity-derived authorization. These functions and schema changes have NOT been deployed to Convex. Pushing Git does not deploy them. Runtime verification against the updated backend, approved taxonomy/listing records and a signed-in test session remains necessary before release.

## QA and remaining release work

Final automated verification: 52 backend tests and 50 frontend tests pass. Coverage includes public projection privacy, publication withdrawal, administrator metric access, enquiry isolation, onboarding persistence, inactive accounts, editor denial, billing origins and existing authorization tests.

Typecheck, lint and production build pass for the final integration. Lint retains three pre-existing unused-variable warnings. The vinext build reports its existing source-map/static-analysis warnings. The frontend public-data unit test now uses a strict query mock, rather than relying on a live deployment being empty.

The local preview server started successfully on port 5175, but browser attachment/navigation repeatedly timed out during the follow-up. The owned preview server was stopped after verification attempts. Authenticated dashboard, onboarding and auth-page visual comparisons are not verified; only the earlier homepage responsive screenshots are verified. No auth bypass or public administrator seed was introduced. Complete these visual checks after an authorized backend rollout and signed-in session. Saved profiles, notification feeds, user settings, reports and activity-log viewer remain visibly unavailable. Validate live Stripe test-mode webhooks before enabling billing. The existing legacy CMS professional catalogue remains a separate preview route; primary administrator navigation now opens the real application queue.

## Files and Git

Public stage: homepage/layout/global tokens, homepage components, shared cards, header/footer/mobile navigation, button styles, hero asset, attribution and contrast test.

Functional stages: convex users, organizations, professionalOwnership, profileFields, schema, staff, contact, stripe/billingUrls and tests; login/signup/auth form; onboarding/claim/profile routes and components; customer/professional dashboards and inbox; admin applications and reference-styled shell/cards; fixture production guard.

Branch: feat/frontend. Homepage commit: 10f06d9. Account/onboarding commit: 65698d2. Dashboard/enquiry commit: 08187fc. Live discovery/metrics commit: 6f716b6. Final verification passed before the QA report commit. No merge into main or deployment is authorized or performed.

## Additional accessibility and behavior

Admin mobile navigation hides closed links from keyboard access, traps focus when open, makes the underlying content inert, restores focus on close and handles Escape. Customer/professional navigation uses a native modal dialog. All console sidebars expose actual logout. Unimplemented navigation items are visibly disabled. Long KPI status values use smaller typography to fit compact cards. Uploaded portraits use storage-backed URLs, and enquiry selectors honor the professional contact preference.
