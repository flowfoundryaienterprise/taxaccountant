import type {
  AdminArticleRow,
  AdminMediaAsset,
  AdminPageRow,
  AdminSettingGroup,
} from "@/lib/admin/admin-types";

/**
 * DEMONSTRATION FIXTURES for the CMS screens that have no data source.
 *
 * ## Why these exist at all
 * `contentPages`, `contentCategories` and `mediaAssets` are defined in
 * `convex/schema.ts` but hold no rows, and no page or article has ever been
 * authored in this project. The Pages, Articles and Media screens would
 * therefore be permanently empty, and an empty table cannot demonstrate
 * sorting, filtering, pagination, status handling or row actions.
 *
 * The Day 6 brief allows this explicitly (section 5): "When working with
 * local development fixtures, clearly label the entire dashboard as a
 * demonstration." Every row below carries `provenance: "demonstration"`,
 * every screen renders a persistent banner, and the CMS is stripped from
 * production builds entirely.
 *
 * ## What is deliberately NOT here
 *  - **No tax guidance.** Not one block below states a rate, threshold,
 *    deadline, filing requirement or any other substantive tax position.
 *    The article bodies describe *what the article would cover*, in the
 *    same register the Day 4 service pages use. Unreviewed tax content
 *    presented as authoritative is the specific failure the brief warns
 *    about (section 11).
 *  - **No fabricated review records.** An article has `reviewer` and
 *    `reviewedAt` only where the fixture is explicitly modelling the
 *    reviewed state; the drafts carry neither, which is why the overview's
 *    "pending review" figure is a real count rather than a decoration.
 *  - **No real staff identities.** Authors are role descriptions
 *    ("Editorial team"), not invented people with job titles.
 *  - **No private media.** Every media row points at a file that already
 *    ships in `public/` and is already publicly served.
 */

/** Fixed dates. Never `Date.now()`, which would fake freshness on reload. */
const D = {
  jan: "2026-01-14T00:00:00.000Z",
  feb: "2026-02-03T00:00:00.000Z",
  mar: "2026-03-22T00:00:00.000Z",
  apr: "2026-04-09T00:00:00.000Z",
  may: "2026-05-18T00:00:00.000Z",
  jun: "2026-06-27T00:00:00.000Z",
  jul: "2026-07-07T00:00:00.000Z",
  aug: "2026-08-30T00:00:00.000Z",
} as const;

export const demoPages: AdminPageRow[] = [
  {
    id: "page-about",
    title: "About TaxAccountant.com",
    slug: "about",
    kind: "page",
    status: "published",
    locale: "en",
    summary: "What the marketplace does, who it is for, and what it deliberately does not do.",
    body: [
      { type: "heading", level: 2, text: "What this marketplace is" },
      {
        type: "paragraph",
        text: "A directory that helps people find tax and accounting professionals by country, tax jurisdiction, service and language.",
      },
      {
        type: "callout",
        text: "This page would carry the platform's standing disclaimer about not providing tax advice.",
      },
    ],
    seo: {
      title: "About TaxAccountant.com",
      description: "How the TaxAccountant.com marketplace works and who it serves.",
      canonicalPath: "/about",
    },
    updatedAt: D.jun,
    provenance: "demonstration",
  },
  {
    id: "page-how-it-works",
    title: "How It Works",
    slug: "how-it-works",
    kind: "page",
    status: "published",
    locale: "en",
    summary: "The discovery process from search through to contacting a professional.",
    body: [
      { type: "heading", level: 2, text: "Finding a professional" },
      {
        type: "paragraph",
        text: "Search by country, tax jurisdiction, service category and language, then compare listings.",
      },
      {
        type: "list",
        items: [
          "Search and filter the directory",
          "Compare listings and read profiles",
          "Confirm authorization directly with the professional",
        ],
      },
    ],
    seo: {
      title: "How TaxAccountant.com Works",
      description: "Search, compare and contact tax professionals across jurisdictions.",
      canonicalPath: "/how-it-works",
    },
    updatedAt: D.may,
    provenance: "demonstration",
  },
  {
    id: "page-privacy",
    title: "Privacy Policy",
    slug: "privacy",
    kind: "page",
    status: "review",
    locale: "en",
    summary: "How personal data submitted through public forms is handled.",
    body: [
      {
        type: "callout",
        text: "A privacy policy requires legal review before publication. This record is held in review for that reason.",
      },
    ],
    seo: { canonicalPath: "/privacy" },
    updatedAt: D.jul,
    provenance: "demonstration",
  },
  {
    id: "page-terms",
    title: "Terms of Service",
    slug: "terms",
    kind: "page",
    status: "review",
    locale: "en",
    summary: "The terms under which the marketplace may be used.",
    body: [
      {
        type: "callout",
        text: "Requires legal review before publication.",
      },
    ],
    seo: { canonicalPath: "/terms" },
    updatedAt: D.jul,
    provenance: "demonstration",
  },
  {
    id: "page-glossary-jurisdiction",
    title: "Tax jurisdiction",
    slug: "tax-jurisdiction",
    kind: "glossary",
    status: "draft",
    locale: "en",
    summary: "Why a tax jurisdiction is not the same thing as a country.",
    body: [
      {
        type: "paragraph",
        text: "A glossary entry explaining the distinction the directory keeps between where a professional is based and which tax authority they may act before.",
      },
    ],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "page-guide-choosing",
    title: "Choosing a tax professional",
    slug: "choosing-a-tax-professional",
    kind: "guide",
    status: "draft",
    locale: "en",
    summary: "Questions worth asking before engaging anyone.",
    body: [
      {
        type: "list",
        items: [
          "Which tax jurisdictions are you authorized for?",
          "What is the scope of the work, and what is excluded?",
          "How are fees calculated?",
        ],
      },
    ],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "page-contact",
    title: "Contact",
    slug: "contact",
    kind: "page",
    status: "draft",
    locale: "en",
    summary: "The public contact route, pending the Phase 1 contact workflow.",
    body: [
      {
        type: "callout",
        text: "Blocked on contact:submit and the public contact form. Held as a draft rather than published as a page that cannot receive a message.",
      },
    ],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "page-accessibility",
    title: "Accessibility Statement",
    slug: "accessibility",
    kind: "page",
    status: "archived",
    locale: "en",
    summary: "Superseded by a draft that covers WCAG 2.2 rather than 2.1.",
    body: [{ type: "paragraph", text: "Archived in favour of a newer draft." }],
    seo: {},
    updatedAt: D.mar,
    provenance: "demonstration",
  },
];

export const demoArticles: AdminArticleRow[] = [
  {
    id: "article-cross-border",
    title: "What cross-border filing obligations actually mean",
    slug: "cross-border-filing-obligations",
    category: "International tax",
    author: "Editorial team",
    reviewer: "Reviewing tax professional",
    reviewedAt: D.may,
    status: "published",
    excerpt:
      "Why living in one country and filing in another is common, and what to establish before assuming either.",
    body: [
      { type: "heading", level: 2, text: "Residence and obligation are separate questions" },
      {
        type: "paragraph",
        text: "An article explaining, in general terms, why a filing obligation does not automatically follow from where someone lives.",
      },
      {
        type: "callout",
        text: "General information only. Nothing here is advice about an individual tax position.",
      },
    ],
    jurisdictionCode: undefined,
    featuredImage: {
      path: "/images/article-international-globe.jpg",
      alt: "A hand holding a small flag beside a world globe",
    },
    seo: {
      title: "Cross-border filing obligations explained",
      description: "Why tax residence and filing obligations are separate questions.",
    },
    publishedAt: D.may,
    updatedAt: D.jun,
    provenance: "demonstration",
  },
  {
    id: "article-records",
    title: "Records a professional will usually ask for",
    slug: "records-a-professional-will-ask-for",
    category: "Working with an accountant",
    author: "Editorial team",
    reviewer: "Reviewing tax professional",
    reviewedAt: D.apr,
    status: "published",
    excerpt: "What to gather before a first conversation, and why it shortens the work.",
    body: [
      {
        type: "paragraph",
        text: "An article describing the categories of record that commonly matter, without stating any jurisdiction's requirements.",
      },
    ],
    featuredImage: {
      path: "/images/article-tax-documents.jpg",
      alt: "Tax paperwork laid out on a desk beside a calculator",
    },
    seo: {
      title: "Records to gather before meeting an accountant",
      description: "The categories of record that commonly matter.",
    },
    publishedAt: D.apr,
    updatedAt: D.apr,
    provenance: "demonstration",
  },
  {
    id: "article-small-business",
    title: "Bookkeeping and tax filing for a small business",
    slug: "bookkeeping-and-tax-filing-small-business",
    category: "Business tax",
    author: "Editorial team",
    status: "review",
    excerpt: "How ongoing bookkeeping relates to the annual filing it feeds.",
    body: [
      {
        type: "paragraph",
        text: "Awaiting review by an authorized professional before publication.",
      },
    ],
    featuredImage: {
      path: "/images/article-small-business.jpg",
      alt: "An accountant's workspace with ledgers and a laptop",
    },
    seo: {},
    updatedAt: D.jul,
    provenance: "demonstration",
  },
  {
    id: "article-audit",
    title: "What happens during a tax audit",
    slug: "what-happens-during-a-tax-audit",
    category: "Audit support",
    author: "Editorial team",
    status: "review",
    excerpt: "The general shape of an examination and where representation helps.",
    body: [
      {
        type: "callout",
        text: "Audit procedure differs materially by jurisdiction. This draft must be reviewed, and may need to be split per jurisdiction, before publication.",
      },
    ],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "article-amended",
    title: "Correcting a return after it has been filed",
    slug: "correcting-a-return-after-filing",
    category: "Individual tax",
    author: "Editorial team",
    status: "draft",
    excerpt: "Why amendment is routine, and what to establish first.",
    body: [{ type: "paragraph", text: "Early draft." }],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "article-choosing-jurisdiction",
    title: "Finding a professional authorized where you file",
    slug: "finding-a-professional-authorized-where-you-file",
    category: "Working with an accountant",
    author: "Editorial team",
    status: "draft",
    excerpt: "Using the jurisdiction filter rather than the country filter.",
    body: [{ type: "paragraph", text: "Early draft." }],
    seo: {},
    updatedAt: D.aug,
    provenance: "demonstration",
  },
  {
    id: "article-deprecated-rates",
    title: "Tax rates by country",
    slug: "tax-rates-by-country",
    category: "International tax",
    author: "Editorial team",
    status: "archived",
    excerpt: "Withdrawn: the platform does not publish rates, thresholds or deadlines.",
    body: [
      {
        type: "callout",
        text: "Archived by editorial decision. Rates and thresholds change, depend on circumstances, and publishing them without jurisdiction-specific review would be worse than publishing nothing.",
      },
    ],
    seo: {},
    updatedAt: D.feb,
    provenance: "demonstration",
  },
];

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
    objectKey: "public/images/hero-accountant.jpg",
    path: "/images/hero-accountant.jpg",
    contentType: "image/jpeg",
    sizeBytes: 146_000,
    altText: "A smiling professional working at a laptop in an office",
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
