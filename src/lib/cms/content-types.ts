import type { EditorialStatus } from "@/lib/cms/content-status";

/**
 * The data contracts the CMS and the public pages are written against.
 *
 * ## Why this file exists
 * There is no Convex content query in this project. The entire generated
 * API surface is `healthCheck:status`, which touches no table (verified
 * Day 7). So rather than scatter fixture imports through twenty screens and
 * rewrite them all later, every read goes through one of the two interfaces
 * below, and a single adapter module decides what satisfies them today.
 *
 * When the authorized queries land, the adapter changes and nothing else
 * does. Each method names the Convex function it is standing in for, so the
 * backend has a concrete contract rather than a blank page.
 *
 * ## The two interfaces are not interchangeable
 * `ContentRepository` is the **staff** contract: it can see drafts, review
 * state and editorial metadata. Every one of its methods will require an
 * authenticated staff identity and a server-side role check.
 *
 * `PublicContentRepository` is the **public** contract: it returns only
 * published, approved, public-safe projections, and its return types have no
 * field for a draft, an author subject or an internal note — so a public
 * component cannot render one even by mistake.
 *
 * Keeping them as separate types is the point. A single repository with a
 * `includeDrafts?: boolean` flag is one forgotten argument away from leaking
 * unpublished content onto a public page.
 */

/** Shared SEO shape, mirroring the `seo` object in `convex/schema.ts`. */
export interface CmsSeo {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImagePath?: string;
}

/** One structured content block. Plain text only — never markup. */
export type CmsBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

/**
 * Editorial metadata. Staff-only: none of this reaches a public projection.
 */
export interface EditorialMeta {
  status: EditorialStatus;
  /** Display name resolved from `authorSubject`; never the raw subject. */
  author?: string;
  /** Display name resolved from `reviewerSubject`. */
  reviewer?: string;
  /** `contentPages.reviewedAt` — when the content was last reviewed. */
  reviewedAt?: string;
  /** `contentPages.publishedAt` — distinct from `reviewedAt` on purpose. */
  publishedAt?: string;
  updatedAt: string;
}

/** A content page as the CMS sees it. Mirrors `contentPages`. */
export interface CmsPage {
  id: string;
  slug: string;
  kind: "page" | "guide" | "glossary";
  title: string;
  summary?: string;
  body: CmsBlock[];
  locale: string;
  seo: CmsSeo;
  editorial: EditorialMeta;
}

/** An article as the CMS sees it. `contentPages` with `kind: "blog"`. */
export interface CmsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: CmsBlock[];
  category: string;
  /** Resolved from `contentPages.jurisdictionId`. */
  jurisdictionCode?: string;
  featuredImage?: { path: string; alt: string };
  locale: string;
  seo: CmsSeo;
  editorial: EditorialMeta;
}

/** Cursor pagination, matching the convention in API.md section 1. */
export interface CmsPage_<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CmsListFilters {
  q?: string;
  status?: EditorialStatus | "all";
  cursor?: string;
  limit?: number;
}

/**
 * Staff content reads. **Every method requires an authenticated staff
 * identity and a server-side role check.**
 *
 * Writes are deliberately absent from this interface. Day 7 is read
 * integration; adding method signatures for mutations that do not exist
 * would invite a call site to be written against them.
 */
export interface ContentRepository {
  /** → `cms:listPages` */
  listPages(filters: CmsListFilters): Promise<CmsPage_<CmsPage>>;
  /** → `cms:getPage` */
  getPage(id: string): Promise<CmsPage | undefined>;
  /** → `cms:listArticles` */
  listArticles(filters: CmsListFilters): Promise<CmsPage_<CmsArticle>>;
  /** → `cms:getArticle` */
  getArticle(id: string): Promise<CmsArticle | undefined>;
}

// ---------------------------------------------------------------------------
// Public projections
// ---------------------------------------------------------------------------

/**
 * A published article as the public site sees it.
 *
 * Note what is structurally absent: no status, no author subject, no
 * reviewer subject, no draft body, no internal note. A public component
 * holding one of these has no field to leak.
 *
 * `reviewedAt` *is* present and `publishedAt` is separate, because for tax
 * content the reader genuinely needs both and the Day 7 brief requires them
 * to be distinguishable.
 */
export interface PublicArticle {
  slug: string;
  title: string;
  excerpt?: string;
  body: CmsBlock[];
  category: string;
  /** Present only when the article is genuinely jurisdiction-specific. */
  jurisdictionCode?: string;
  jurisdictionLabel?: string;
  featuredImage?: { path: string; alt: string };
  /** Display name only — never the underlying auth subject. */
  author?: string;
  reviewer?: string;
  /** ISO date. Absent when no review has been recorded. */
  reviewedAt?: string;
  /** ISO date. Absent only if a published record somehow lacks one. */
  publishedAt?: string;
  seo: CmsSeo;
}

/** A published content page as the public site sees it. */
export interface PublicPage {
  slug: string;
  title: string;
  summary?: string;
  body: CmsBlock[];
  seo: CmsSeo;
  publishedAt?: string;
}

/**
 * Public content reads. Unauthenticated, and returning **only** published,
 * approved, public-safe records.
 *
 * The authorized implementation must filter by status in the query itself.
 * A frontend filter over a query that returned drafts would be no filter at
 * all — anything the server sends, a caller can read.
 */
export interface PublicContentRepository {
  /** → `content:listPublishedResources` */
  listArticles(options?: {
    category?: string;
    limit?: number;
    cursor?: string;
  }): Promise<CmsPage_<PublicArticle>>;
  /** → `content:getPublishedBySlug` */
  getArticle(slug: string): Promise<PublicArticle | undefined>;
  /** → `content:getPublishedBySlug` */
  getPage(slug: string): Promise<PublicPage | undefined>;
  /** Distinct categories across published articles, for the index filter. */
  listCategories(): Promise<string[]>;
}

/**
 * How a repository's data is currently being satisfied. Rendered on screen
 * so a reader always knows, rather than having to trust a comment.
 */
export type RepositoryBacking = "convex" | "fixtures" | "empty";

export interface RepositoryStatus {
  backing: RepositoryBacking;
  /** Plain-language explanation, shown in the UI. */
  detail: string;
}
