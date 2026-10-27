/**
 * Typed contracts for the Phase 1 CMS screens.
 *
 * Field names mirror the Convex collections in `convex/schema.ts` so each
 * screen can be repointed at an authorized query without reshaping the UI:
 *
 *   AdminPageRow      -> `contentPages` (kind: "page" | "guide" | "glossary")
 *   AdminArticleRow   -> `contentPages` (kind: "blog") + `contentCategories`
 *   AdminServiceRow   -> `serviceCategories`
 *   AdminCountryRow   -> `countries`
 *   AdminJurisdiction -> `taxJurisdictions`
 *   AdminProfessional -> `professionals` + joins
 *   AdminMediaAsset   -> `mediaAssets`
 *   AdminSetting      -> `siteSettings`
 *
 * Deliberately absent: view counts, traffic, engagement, revenue and any
 * other operational metric. None of those have a collection or an approved
 * source, so no component has a field to render a fabricated one.
 */

/** Mirrors `contentPages.status` and `countries.status`. */
export type ContentStatus = "draft" | "review" | "published" | "archived";

/** Mirrors `serviceCategories.publicationStatus`. */
export type ServicePublicationStatus = "draft" | "published" | "archived";

/** Mirrors `professionals.publicationStatus`. */
export type ListingStatus = "draft" | "review" | "published" | "suspended" | "archived";

/** Mirrors `professionals.verificationStatus`. */
export type VerificationStatus =
  | "not_reviewed"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

/** Every status badge in the CMS resolves to one of these tones. */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/** Mirrors the shared `seo` object used by several collections. */
export interface AdminSeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImagePath?: string;
}

/**
 * Where a row's data actually comes from. Rendered as a visible label on
 * every screen, so a reader can never mistake a demonstration record for an
 * approved one.
 *
 *  - `approved`      — read from a module the public site already renders.
 *  - `demonstration` — a Day 6 fixture that exists only to exercise the UI.
 */
export type DataProvenance = "approved" | "demonstration";

export interface AdminPageRow {
  id: string;
  title: string;
  slug: string;
  kind: "page" | "guide" | "glossary";
  status: ContentStatus;
  locale: string;
  summary?: string;
  /** Structured blocks; never raw HTML (DESIGN.md: "no embedded executable HTML"). */
  body: ContentBlock[];
  seo: AdminSeo;
  /** ISO-8601. Fixtures carry a fixed date, never "now". */
  updatedAt: string;
  provenance: DataProvenance;
}

export interface AdminArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  /** `contentPages.authorSubject`, resolved to a display name. */
  author?: string;
  /** `contentPages.reviewerSubject`, resolved. Absent until reviewed. */
  reviewer?: string;
  /** When the editorial review actually happened. Absent if it has not. */
  reviewedAt?: string;
  status: ContentStatus;
  excerpt?: string;
  body: ContentBlock[];
  /** Tax jurisdiction this article is written for, where that matters. */
  jurisdictionCode?: string;
  featuredImage?: { path: string; alt: string };
  seo: AdminSeo;
  publishedAt?: string;
  updatedAt: string;
  provenance: DataProvenance;
}

/**
 * Structured content block.
 *
 * A deliberately small, safe vocabulary rather than a rich-text editor
 * dependency (Day 6 brief section 11: "Do not install a large rich-text
 * editor without an approved technical reason"). It maps cleanly onto
 * `contentPages.body`, whose exact block schema DATABASE.md leaves open.
 */
export type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export interface AdminServiceRow {
  id: string;
  name: string;
  slug: string;
  summary: string;
  /** Lucide icon name as referenced in `home-content.ts`. */
  iconRef: string;
  featuredImagePath?: string;
  sortOrder: number;
  status: ServicePublicationStatus;
  seo: AdminSeo;
  provenance: DataProvenance;
}

export interface AdminCountryRow {
  id: string;
  name: string;
  code: string;
  /**
   * `countries.discoverable` — whether the country appears in public
   * discovery. Separate from every activation flag below.
   */
  discoverable: boolean;
  /** `countries.status` — the editorial state of the country record. */
  status: ContentStatus;
  /**
   * Operational activation flags. Each is a distinct permission and none
   * implies another; a country being present and discoverable says nothing
   * about whether the marketplace may transact there.
   */
  onboardingEnabled: boolean;
  transactionEnabled: boolean;
  paymentEnabled: boolean;
  defaultLocale: string;
  displayCurrency: string;
  /** Service slugs genuinely represented for this country. */
  serviceSlugs: string[];
  /** Language codes genuinely represented, derived from listings. */
  languageCodes: string[];
  jurisdictionCodes: string[];
  seo: AdminSeo;
  provenance: DataProvenance;
}

export interface AdminJurisdictionRow {
  id: string;
  code: string;
  label: string;
  countryCode: string;
  /** Mirrors `taxJurisdictions.level`. */
  level: "national" | "state" | "province" | "local" | "other";
  active: boolean;
  /** Service categories represented for this jurisdiction in listings. */
  serviceSlugs: string[];
  provenance: DataProvenance;
}

export interface AdminProfessionalRow {
  id: string;
  slug: string;
  displayName: string;
  firmName?: string;
  countryCode: string;
  city: string;
  serviceSlugs: string[];
  jurisdictionCodes: string[];
  languageCodes: string[];
  status: ListingStatus;
  verificationStatus: VerificationStatus;
  /** True only when a documented review actually wrote a timestamp. */
  credentialsReviewed: boolean;
  provenance: DataProvenance;
}

export interface AdminMediaAsset {
  id: string;
  objectKey: string;
  /** Public path for assets already shipped in `public/`. */
  path: string;
  contentType: string;
  sizeBytes: number;
  altText?: string;
  /** Mirrors `mediaAssets.approvalStatus` / `visibility`. */
  approvalStatus: "draft" | "approved" | "rejected";
  visibility: "private" | "public";
  provenance: DataProvenance;
}

/** One row of the central SEO overview, flattened across content types. */
export interface AdminSeoRow {
  id: string;
  contentTitle: string;
  path: string;
  contentType: string;
  seoTitle?: string;
  metaDescription?: string;
  status: string;
  /**
   * Whether the live route is actually indexable today. Read from the real
   * route metadata, not from an editable field — several public routes are
   * deliberately `noindex` while they render development fixtures.
   */
  indexable: boolean;
  indexableReason: string;
  provenance: DataProvenance;
}

export interface AdminSettingField {
  key: string;
  label: string;
  /** Current value where one genuinely exists in the codebase. */
  value?: string;
  hint: string;
  /**
   * `implemented` — the value shown is the one the site actually uses.
   * `pending`     — no storage exists yet; the field renders as a placeholder.
   */
  state: "implemented" | "pending";
}

export interface AdminSettingGroup {
  id: string;
  title: string;
  description: string;
  fields: AdminSettingField[];
}
