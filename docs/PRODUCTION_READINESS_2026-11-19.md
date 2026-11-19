# Production readiness audit — 19 November 2026

This records verified findings and the remaining release gates on `feat/frontend`. It is not a declaration that the marketplace is production ready.

## Confirmed defects and changes

| Severity | Finding | Evidence and resolution |
| --- | --- | --- |
| High | The deployed homepage canonical and sitemap use `https://taxaccountant.com` while the supplied live host is `https://taxaccountant.flowfoundryai.in`. | Read-only live HTTP checks returned the wrong canonical and sitemap origin. SEO now reads `NEXT_PUBLIC_SITE_URL`, falls back to the supplied host, and requires an explicit production environment plus matching configured host before indexing. A deployment rebuild and live recheck are required. |
| High | Anonymous contact intake relied on a caller supplied elapsed time and honeypot. | The mutation now uses transactional Convex limits per normalized email and globally, validates consent version, source path and payload lengths, and rejects common tax/bank identifiers. Honeypot remains supplemental. Convex and unit tests cover validation and throttling. |
| High | Stripe webhook events were marked processed before the subscription update. A failed update could be skipped on replay. | Subscription upsert and event marker now commit in one Convex mutation. Unhandled event types are acknowledged separately. A replay test confirms the second delivery cannot overwrite the first. No live or test Stripe charge was made. |
| Medium | A profile enquiry link lost its intended professional during sign-in. The general enquiry options query only scanned 50 profiles. | A restricted same-site return path preserves professional and service through sign-in. A targeted authorized options read loads the chosen published, approved profile beyond the first 50. Tests cover redirect validation and a profile beyond the first 50. |
| Medium | Missing `NEXT_PUBLIC_CONVEX_URL` constructed a public Convex client at module import. | The client is now lazy and reports missing/invalid configuration. The homepage listing section and directory render explicit unavailable/retry states when public reads fail. `/api/health` is a process probe; `/api/readiness` checks a Convex database read and returns 503 on failure. |
| Medium | Terms said the site does not process payments, although professional Stripe subscriptions are implemented. | The draft now distinguishes professional subscriptions from customer payments to professionals. The Privacy draft names Better Auth, Convex, enquiries and Stripe. Both still require legal approval. |
| High | Vite 8.3.0 was inside reported advisories. | Updated to 8.3.8, the compatible same-major patch. Typecheck, tests and Cloudflare build were rerun. |

## Release blockers and limitations

1. **Directory scale:** `professionals.publishedDirectory` still projects at most 100 approved candidates. `professionals.search` filters a database page after fetching it, so sparse/empty pages and incorrect totals remain possible. The page now discloses the cap and stays `noindex`. Replacing this requires a maintained indexed public search projection, cursor-based filtering and a count strategy; simply raising `take(100)` would move the failure threshold. Test with more than 100 approved profiles before release.
2. **Catalogue consistency:** Admin service data and public service pages still use different fixture/Convex paths. Staff must not treat fixture rows as published catalogue state. Complete the published-record source of truth and safe CRUD/audit checks before declaring the catalogue workflow ready.
3. **Dependency advisories:** `npm audit --omit=dev` still reports 17 packages (1 critical, 7 high, 7 moderate, 2 low). The critical Better Auth advisory concerns OAuth state; this app configures email/password, not OAuth, but the dependency remains vulnerable. The available fix requires a `@convex-dev/better-auth` major upgrade and needs a dedicated compatibility and auth regression run. Cloudflare/Vinext fixes are also major or prerelease changes; they were not applied blindly.
4. **Legal approval:** Privacy and Terms remain drafts. Obtain approved text for account and subscription terms, cancellation/refunds, retention, data rights, processing basis and jurisdiction-specific claims before launch. Do not describe them as approved policies.
5. **Abuse controls:** Per-email limits can be bypassed with rotating addresses. Configure Cloudflare IP/WAF limits or a verified challenge for public intake. Identifier detection catches common patterns only; staff must still handle sensitive data safely. Do not request tax IDs, bank details or documents in public forms.
6. **End-to-end access:** No safe customer/professional/staff test credentials or Stripe test-mode configuration were supplied. Sign-up, sign-in, password reset, account switching, staff access and payment flows were not verified in a real browser session. The browser automation native pipe was unavailable. No production customer data or live payment configuration was changed.
7. **Live deployment:** Read-only HTTP checks found `/`, `/robots.txt`, `/sitemap.xml`, `/api/health`, `/find-accountant`, `/contact` and `/services` reachable; `/api/readiness` is 404 on the current deployment because these changes have not been deployed. A local Cloudflare preview without Convex configuration returned 500 for public pages despite the explicit component-level unavailable states; the process health probe returned 200 and readiness returned 503. This still needs root-cause analysis. Console, hydration, responsive and keyboard checks remain unverified. The supplied host must be rechecked after deployment.

## Deployment configuration

| Location | Variable | Requirement |
| --- | --- | --- |
| Cloudflare build/runtime | `NEXT_PUBLIC_SITE_URL` | Set exactly `https://taxaccountant.flowfoundryai.in` on the approved production deployment. Set the preview origin on previews. |
| Cloudflare build/runtime | `NEXT_PUBLIC_DEPLOYMENT_ENV` | `production` only for the approved host; `preview` elsewhere. Missing or mismatched values keep robots and sitemap closed. |
| Cloudflare build/runtime | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL` | Use the matching production Convex deployment URLs. Browser values are public identifiers, not secrets. |
| Convex deployment | `SITE_URL`, `BETTER_AUTH_SECRET` | Match the approved public origin and provide a secret specific to this deployment. Verify authentication callbacks and cookie behavior. |
| Convex deployment | `RESEND_API_KEY` | Required for password reset and staff MFA email. Replace the test sender with an approved sending domain. |
| Convex deployment | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Use matching Stripe mode and webhook endpoint. Verify test mode before activating billing; never put secrets in `NEXT_PUBLIC_*`. |
| Local CLI only | `CONVEX_DEPLOYMENT` | The inspected local target was `dev:peaceful-bulldog-864`; production deployment was not selected. |

The new Convex rate limiter component and schema index must be deployed to the intended Convex environment before the matching frontend is released. Production deployment, auth origin changes, billing configuration and legal publication require the owner's infrastructure access and approval.

## Verification record

- Baseline: typecheck passed; 50 frontend unit tests passed; lint had four warnings; Convex tests hit five 5-second timeouts under concurrent load; the Cloudflare build failed on an unmatched brace in pre-existing uncommitted CSS; npm audit reported 18 production-tree advisories.
- After changes: typecheck passed; lint exited 0 with four warnings; 56 frontend tests and 59 Convex tests passed; Vinext/Cloudflare build completed with plugin sourcemap and dynamic import warnings. Local preview routes `/api/health`, `/api/readiness`, `/robots.txt` and `/sitemap.xml` returned the expected status; public pages returned 500 with missing Convex configuration. The local CSS work was repaired for verification but remains uncommitted with the other pre-existing UI changes. A clean checkout build still needs verification because that CSS fix is not in this commit.
- CI workflow runs install, typecheck, lint, frontend tests, isolated Convex tests and a Vinext/Cloudflare build on `feat/frontend`. It does not deploy.
