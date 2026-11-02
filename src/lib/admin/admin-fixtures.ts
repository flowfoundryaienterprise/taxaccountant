import type { AdminMediaAsset, AdminSettingGroup } from "@/lib/admin/admin-types";

/**
 * DEMONSTRATION FIXTURES for the CMS screens that still have no data source.
 *
 * Pages and Articles no longer belong here — `contentPages` has a real
 * save/review/publish/delete workflow now (`convex/content.ts`,
 * `convex/cms.ts`), so those screens read Convex directly
 * (`src/lib/cms/content-adapter.ts`) rather than a fixture. `articleCategories`
 * stays, because the article editor's category select still needs a fixed
 * list and no `contentCategories` CRUD exists yet (see the comment in
 * `convex/schema.ts`'s `contentPages.category` field for why). Media and
 * Settings stay fixture-backed for the same reason the Day 6 brief states —
 * `mediaAssets`/`siteSettings` hold no rows and nothing has been authored —
 * so those two screens still carry `provenance: "demonstration"` banners.
 *
 * ## What is deliberately NOT here
 *  - **No private media.** Every media row points at a file that already
 *    ships in `public/` and is already publicly served.
 */

export const articleCategories: string[] = [
  "Individual tax",
  "Business tax",
  "International tax",
  "Audit support",
  "Working with an accountant",
];

/**
 * Media rows.
 *
 * Every entry is a file that already ships in `public/` and is already
 * served publicly, listed in `public/images/ATTRIBUTIONS.md`. Nothing here
 * is a private asset, and no R2 object key, signed URL or credential
 * appears — the R2 integration does not exist yet.
 *
 * `sizeBytes` values are the real on-disk sizes recorded when this fixture
 * was written, so the size column is not decorative.
 */
export const demoMedia: AdminMediaAsset[] = [
  {
    id: "media-hero-accountant",
    objectKey: "public/images/hero-accountant.png",
    path: "/images/hero-accountant.png",
    contentType: "image/png",
    sizeBytes: 2_072_422,
    altText: "Two tax and accounting professionals reviewing figures together on a tablet in a modern office",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-cta-professionals",
    objectKey: "public/images/cta-professionals.jpg",
    path: "/images/cta-professionals.jpg",
    contentType: "image/jpeg",
    sizeBytes: 131_000,
    altText: "Two professionals reviewing a folder together",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-article-tax-documents",
    objectKey: "public/images/article-tax-documents.jpg",
    path: "/images/article-tax-documents.jpg",
    contentType: "image/jpeg",
    sizeBytes: 118_000,
    altText: "Tax paperwork laid out on a desk beside a calculator",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-article-small-business",
    objectKey: "public/images/article-small-business.jpg",
    path: "/images/article-small-business.jpg",
    contentType: "image/jpeg",
    sizeBytes: 109_000,
    altText: "An accountant's workspace with ledgers and a laptop",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-article-globe",
    objectKey: "public/images/article-international-globe.jpg",
    path: "/images/article-international-globe.jpg",
    contentType: "image/jpeg",
    sizeBytes: 124_000,
    altText: "A hand holding a small flag beside a world globe",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-article-calculator",
    objectKey: "public/images/article-accountant-calculator.jpg",
    path: "/images/article-accountant-calculator.jpg",
    contentType: "image/jpeg",
    sizeBytes: 112_000,
    altText: "A person using a calculator beside a notepad and laptop",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-professional-1",
    objectKey: "public/images/professional-1.jpg",
    path: "/images/professional-1.jpg",
    contentType: "image/jpeg",
    sizeBytes: 97_000,
    altText: "Portrait used for a development-only example profile",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-professional-2",
    objectKey: "public/images/professional-2.jpg",
    path: "/images/professional-2.jpg",
    contentType: "image/jpeg",
    sizeBytes: 89_000,
    altText: "Portrait used for a development-only example profile",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-world-map",
    objectKey: "public/images/world-map.svg",
    path: "/images/world-map.svg",
    contentType: "image/svg+xml",
    sizeBytes: 412_000,
    altText: "Public-domain world locator map, recoloured to brand tokens",
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
  {
    id: "media-favicon",
    objectKey: "public/favicon.svg",
    path: "/favicon.svg",
    contentType: "image/svg+xml",
    sizeBytes: 1_200,
    // Deliberately no alt text, so the "missing alt text" filter has a
    // genuine row to find rather than an invented one.
    altText: undefined,
    approvalStatus: "approved",
    visibility: "public",
    provenance: "demonstration",
  },
];

/**
 * Site settings.
 *
 * `implemented` fields show the value the site genuinely uses today, read
 * from the codebase. `pending` fields have no storage at all — `siteSettings`
 * holds no rows — so they render as disabled placeholders rather than as
 * editable fields that would silently discard input.
 *
 * No secret appears here, by construction: there is no field for an API key,
 * deployment credential, auth secret, R2 key or Cloudflare token, so no
 * screen can render one.
 */
export const settingGroups: AdminSettingGroup[] = [
  {
    id: "identity",
    title: "Site identity",
    description: "How the marketplace names and describes itself across the public site.",
    fields: [
      {
        key: "brandName",
        label: "Brand name",
        value: "TaxAccountant.com",
        hint: "Rendered by the header, footer and metadata title template.",
        state: "implemented",
      },
      {
        key: "metaTitleTemplate",
        label: "Title template",
        value: "%s | TaxAccountant.com",
        hint: "Applied to every page title by the root layout.",
        state: "implemented",
      },
      {
        key: "siteDescription",
        label: "Default description",
        value:
          "TaxAccountant.com connects customers with qualified tax and accounting professionals worldwide.",
        hint: "Fallback meta description for routes that do not set their own.",
        state: "implemented",
      },
      {
        key: "siteOrigin",
        label: "Canonical origin",
        value: "https://taxaccountant.com",
        hint: "Base URL used for canonical links and structured data.",
        state: "implemented",
      },
    ],
  },
  {
    id: "contact",
    title: "Public contact information",
    description: "Where the public is directed with questions.",
    fields: [
      {
        key: "contactEmail",
        label: "Public contact address",
        hint: "No public contact address has been approved. The Phase 1 contact workflow is not built.",
        state: "pending",
      },
      {
        key: "contactRoute",
        label: "Contact page route",
        hint: "Depends on contact:submit and a public contact form.",
        state: "pending",
      },
    ],
  },
  {
    id: "social",
    title: "Approved social links",
    description: "Only accounts that genuinely exist and have been approved may appear.",
    fields: [
      {
        key: "socialLinks",
        label: "Social profiles",
        hint: "No social account has been registered or approved for this brand. The footer renders no social links until one is.",
        state: "pending",
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation and footer",
    description: "The public menu structure.",
    fields: [
      {
        key: "primaryNav",
        label: "Primary navigation",
        value: "Find an Accountant · Services · Countries · How It Works · Resources · For Professionals",
        hint: "Currently defined in the site header component, not in configuration.",
        state: "implemented",
      },
      {
        key: "footerContent",
        label: "Footer content",
        hint: "Editable footer content requires siteSettings storage and an authorized mutation.",
        state: "pending",
      },
    ],
  },
  {
    id: "display",
    title: "Language and currency display",
    description: "What the locale and currency selectors offer. Display only — no conversion or translation exists.",
    fields: [
      {
        key: "displayLanguages",
        label: "Displayed languages",
        value: "English (EN)",
        hint: "The selector shows one language. Localization is a Phase 5 scope item.",
        state: "implemented",
      },
      {
        key: "displayCurrencies",
        label: "Displayed currencies",
        value: "USD",
        hint: "A display label only. No price, conversion or payment feature exists.",
        state: "implemented",
      },
    ],
  },
  {
    id: "homepage",
    title: "Homepage featured content",
    description: "Which professionals and services the homepage highlights.",
    fields: [
      {
        key: "featuredProfessionals",
        label: "Featured professionals",
        hint: "professionals.featured exists in the schema but nothing reads it yet — the homepage currently renders hard-coded reference-design fixtures.",
        state: "pending",
      },
      {
        key: "featuredServices",
        label: "Featured services",
        value: "All eight service categories, in catalogue order",
        hint: "Order is defined by the service catalogue module.",
        state: "implemented",
      },
    ],
  },
];
