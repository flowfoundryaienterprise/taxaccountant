# DESIGN.md — TaxAccountant.com Visual and UX System

**Status:** Draft for design approval. Follow `PRD.md`; do not turn future phases into Phase 1 user interfaces. The global marketplace master plan specifies a **premium light-blue** visual direction, not a dark agency website.

## 1. Design goals

- Convey qualified financial-services trust through information clarity, not fake badges or oversized decoration.
- Make **country, tax jurisdiction and service** unmistakably distinct in the search experience.
- Support both quick discovery and thoughtful professional comparison on mobile and desktop.
- Help customers understand what actions are available **now** and what capabilities are not yet launched.
- Keep CMS layouts efficient for staff, with safe review and publishing feedback.

## 2. Brand tokens

**Master-plan colors (approved direction, final contrast/brand approval still required):**

| Token | Color | Usage |
|---|---|---|
| Navy `--navy` | `#102C57` | Headings, primary navigation, high-contrast surfaces |
| Action blue `--action` | `#0879E9` | Primary CTAs, important interactive emphasis; verify text contrast in all combinations |
| Pale blue `--tint` | `#EAF5FF` | Section backgrounds, filter panels, subtle highlights |
| White `--white` | `#FFFFFF` | Primary canvas and cards |
| Slate `--slate` | `#4C6178` | Secondary body text, metadata |
| Brand gold `--gold` | `#CB9F36` | **Mark only.** Sampled from the brand mark (`public/logo.png`), where it is the check and the bullet squares. 5.63:1 on navy; 2.46:1 on white, so it may never carry text, mark a link, or be the only thing identifying a control. In the mark it means *checked* — reserve it for a verified state that has actually been reviewed. Distinct from warning `#9A6700` (1.98:1 against it); the two are not interchangeable. |

**CMS surfaces:** canvas `#F4F6F8` (page ground) and subtle `#F1F4F7` (table headers, row hover, neutral chips). Near-neutral greys on the same 210-degree hue as the ramp. The admin shell previously used `--tint` for all of these — a light blue behind an interface staff read for hours. Both are held to the same contrast bar as white and tint by `palette-contrast.test.ts`.

**Brand mark:** a navy shield carrying a gold check. The master artwork is `public/logo.png`; it holds a document with four gold bullet squares and four navy text bars inside the shield, which is legible at poster size and not below ~64px. `src/components/shared/brand-logo.tsx`, `public/favicon.svg` and the raster icons carry the mark simplified to the shield and the check, within 0.022 of the master's width at its worst row. The master's navy measures `#082E5B`, 1.02:1 from `--navy`; the token is used so mark and interface cannot drift.

**Derived tokens (proposals, test and approve):** neutral borders `#D8E1EB`; success `#18794E`; danger `#B42318`; warning `#9A6700`; focus outline `#1459B5`. Text on saturated blue must meet AA; adjust blue shade rather than accepting failed contrast. Never use color alone to convey status.

## 3. Typography

- Default: accessible sans-serif such as **Inter** or comparable system font (selection pending brand approval).
- Type scale: 12 caption, 14 compact metadata, 16 body, 18 lead, 24 section heading, 32 major heading, 44–52 desktop hero depending on wrap.
- Mobile hero 32–36; limit paragraph line length ~65–75 characters at desktop.
- Headings use semantic hierarchy. Numeric prices, timestamps and dates have clear units/currencies/timezones. No gratuitous ALL CAPS.

## 4. Spacing, grids and surfaces

- Base 4px rhythm; standard intervals 4/8/12/16/24/32/48/64/96.
- Page max width ~1200–1280px; text max width ~720px; gutters mobile 16px, tablet 24px, desktop 32px.
- Responsive grid 1/2/3 columns for cards as space permits. Directory: filters sidebar on desktop, full-screen filter sheet on mobile.
- Radii: 8px inputs, 12px cards, 16px large panels; minimal shadows, clear border and whitespace.
- Standard component states: default, hover, focus, disabled, loading, error, success.

## 5. Reusable components

| Component | Behavior / design rule |
|---|---|
| SiteHeader / SiteFooter | Consistent navigation; location of Sign In/Join can remain informative until Phase 2; responsive, keyboard accessible |
| SearchBar | Separate **country**, **tax jurisdiction** and **service** controls; valid defaults and clear labels |
| FilterPanel / ActiveChips | Clear all/individual resets; mobile apply/cancel and result counts; current filter state in URL |
| ProfessionalCard | Name/firm, approved qualifications, jurisdiction(s), languages, service tags, CTA; no invented rating/status |
| ProfileHero / CredentialList | Structured approved facts; verification indicator only when reviewed and approved |
| CountryStatusNotice | Explain availability and unsupported operations without misrepresenting country authorization |
| ServiceCard / CountryTile | Consistent hover/focus states, proper accessible links |
| RichTextBlock | Safe headings, lists, links and imagery from CMS content; no embedded executable HTML |
| FAQAccordion / Breadcrumbs | Keyboard and screen-reader usable; one consistent pattern |
| FormField / Select / DateTimeField | Persistent label, hint, validation/error message and accessible required marker |
| Pagination / SortControl | Preserve filters, shareable URLs and focus position after transition |
| Banner / Toast / Modal | Clear severity and dismiss/escape behavior; critical failures announced accessibly |
| CMSDataTable | Sort/filter where needed, status labels, action permissions, empty/loading states |
| CMSPublishControls | Preview, draft/publish/unpublish, unsaved-change warning and review status |
| MediaPicker | R2 upload progress, alt text, scan/approval state, safe deletion |

Use shared design primitives before one-off styling. The UI may use shadcn/ui where compatible with accessibility and visual tokens; it is not an excuse for generic SaaS styling.

## 6. Navigation and information architecture

**Primary navigation:** Find an Accountant · Services · Countries · How It Works · Resources · For Professionals · Sign In · Join. On initial Phase 1, Sign In may be staff-only or labeled clearly; public customer/professional signup is not enabled until Phase 2. Use accessible menu semantics.

**Homepage:** trusted search-first hero → service categories → approved professional highlights (only when truly available) → how matching/discovery works → jurisdiction and country coverage → resources → professional interest CTA → footer.

**Directory:** heading and active jurisdiction context → search and filters → results count → cards → pagination; no forced account sign-in for Phase 1 public discovery.

**Profile:** identity and firm, approved credentials/status, practice jurisdictions, service expertise, languages, location and remote indication, contact/CTA appropriate to launched phase, trust/disclaimer and related approved resources.

**Country page:** country context, legal disclaimers, supported service categories, links to relevant directory filters and content. Avoid implying universal right to practice.

**Resource pages:** author/reviewer and reviewed date when available; visible disclaimer; easy updates through CMS.

**CMS:** persistent section navigation (content, profiles, taxonomy, media, enquiries, settings, audit), clear table filters, editor preview and user action feedback. Only show authorized sections.

## 7. Page-level wireframe guidance

| Page | Top / middle / bottom |
|---|---|
| Home | Search hero / service & country paths / trust, guides and CTA |
| Directory | Search summary / desktop filters + professional results / pagination or no-results guidance |
| Professional detail | Profile summary & verification / services, jurisdictions, credentials / related professionals and CTA |
| Services & individual service | Category overview / accurate scope and practitioner links / FAQs, country caveats and CTA |
| Countries/cities | Area context / service jurisdiction filter / approved local content and routes |
| Resources/blog | Category & query / editorial cards / content with legal disclaimer and updates |
| Contact & professional interest | Form purpose and privacy / inputs and consent / success or recoverable failure |
| CMS edit | Status breadcrumb and actions / structured fields / preview + revision/approval panel |
| Dashboards Phase 2+ | Priority tasks / relevant user-owned data / contextual actions and notifications |
| Bookings/payments Phase 3+ | Explicit stepper / confirmed data and totals / provider state, receipts and support |

## 8. Forms and interactions

- Labels are visible; placeholders are examples, not labels. Mark required fields and show inline errors adjacent to the input.
- Search should not reset filters on back/forward, refresh or shareable URL loads.
- Debounced keyword search may be used; press Enter must work. Never fire expensive queries per keystroke without control.
- Destructive CMS actions require confirmation, appropriate permissions and an auditable result.
- Animations: 120–200ms subtle transitions; respect `prefers-reduced-motion`. No carousels that hide essential content or auto-move without control.
- Phase 2 verification: show `Submitted`, `Under review`, `Approved`, `Rejected`, `Expired`; only `Approved` earns the verified label.
- Phase 3 booking: distinguish proposed times, pending confirmation and confirmed slots.
- Phase 4 paid promotion: visually label **Sponsored** on every paid placement.

## 9. Loading, empty and error design

- **Loading:** stable skeleton sized like eventual card/table; no skeleton for content instantaneously available.
- **No profiles:** state what filters are active, clear filters, suggest nearby supported jurisdictions or contact; never fabricate inventory.
- **Missing profile/disabled country:** meaningful 404/availability message and return navigation, no exposed unpublished data.
- **Form:** inline validation, submit disabled only while sending, success receipt, explicit error with safe retry, state preserved on failure.
- **CMS:** save progress, updated timestamp, lost connection banner, conflict resolution rather than overwriting newer published content.
- **Account:** expired/forbidden distinct from missing data, logout path accessible.
- **File upload:** processing/pending scan, approved/rejected, retry where safe; never show sensitive URL publicly.

## 10. Responsive and accessibility contract

- Breakpoint *guidance* (CSS implementation may vary): `<640px` phone, `640–1023px` tablet, `1024–1279px` laptop, `≥1280px` large.
- Minimum 44×44px touch target wherever practical, comfortable spacing and accessible hit regions.
- Keyboard navigation: tab order, Escape for overlays, arrow keys for recognized widget patterns, focus restoration after modals and filters.
- WCAG 2.2 AA contrast, visible focus, skip link, semantic landmarks, no keyboard traps, error summaries for long forms, `aria-live` for relevant updates.
- Language attributes and locale/date/time formatting verified as localization expands in Phase 5; text may expand substantially.
- Optimize images and fonts; no layout shift when profile pictures and cards load.

## 11. Content integrity and design review

- Use approved brand assets and rights-cleared media only. Testimonials, credentials, reviews and price examples are omitted unless substantiated.
- Show `No verified reviews yet` only when the feature exists and this is true, otherwise omit rating area.
- Country disclaimers and tax/legal guidance require stakeholder review; use dates on maintained guides where provided.
- Maintain a desktop/mobile design approval sheet for homepage, directory, profile, country/service, resources, contact, CMS and core states **before** full implementation.
