import { demoArticles, demoPages } from "@/lib/admin/admin-fixtures";
import type {
  CmsArticle,
  CmsListFilters,
  CmsPage,
  CmsPage_,
  ContentRepository,
  RepositoryStatus,
} from "@/lib/cms/content-types";
import type { EditorialStatus } from "@/lib/cms/content-status";
import type { AdminArticleRow, AdminPageRow } from "@/lib/admin/admin-types";

/**
 * Staff-side content reads.
 *
 * ## Staff only
 * This module backs `ContentRepository` with the CMS demonstration
 * fixtures. No `cms:*` Convex query exists yet — staff authentication and
 * role checking do exist (`src/app/admin/layout.tsx`, `convex/staff.ts`),
 * but there is nothing for them to authorize here, since every read below
 * is a static fixture rather than a Convex call.
 *
 * **It must only ever be imported by CMS code.** The public counterpart
 * lives in `./public-content-adapter` and deliberately imports no fixture
 * module, so a public route has no import edge to this data at all — see
 * the note there for why that separation is load-bearing rather than
 * stylistic.
 *
 * ## Swapping in Convex
 * Replace each method body with the corresponding staff query and update
 * `staffRepositoryStatus`. Every one of those queries needs
 * `requireStaff` (`convex/staff.ts`) at the top of its handler, the same
 * way a future `cms:*` mutation would.
 */

export const staffRepositoryStatus: RepositoryStatus = {
  backing: "fixtures",
  detail: "Reading local demonstration fixtures. No cms:* Convex query exists yet.",
};

// ---------------------------------------------------------------------------
// Fixture → contract mapping
// ---------------------------------------------------------------------------

/** The Day 6 fixture rows predate these contracts; this reshapes them. */
function pageFromRow(row: AdminPageRow): CmsPage {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    body: row.body,
    locale: row.locale,
    seo: row.seo,
    editorial: {
      status: row.status as EditorialStatus,
      updatedAt: row.updatedAt,
    },
  };
}

function articleFromRow(row: AdminArticleRow): CmsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    jurisdictionCode: row.jurisdictionCode,
    featuredImage: row.featuredImage,
    locale: "en",
    seo: row.seo,
    editorial: {
      status: row.status as EditorialStatus,
      author: row.author,
      reviewer: row.reviewer,
      reviewedAt: row.reviewedAt,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    },
  };
}

export const cmsPages = (): CmsPage[] => demoPages.map(pageFromRow);
export const cmsArticles = (): CmsArticle[] => demoArticles.map(articleFromRow);

function paginate<T>(items: T[], filters: CmsListFilters): CmsPage_<T> {
  const limit = filters.limit ?? 20;
  const start = filters.cursor ? Number.parseInt(filters.cursor, 10) || 0 : 0;
  const slice = items.slice(start, start + limit);
  const next = start + limit;

  return {
    items: slice,
    hasMore: next < items.length,
    nextCursor: next < items.length ? String(next) : undefined,
  };
}

function matchesFilters(
  record: { title: string; slug: string; editorial: { status: EditorialStatus } },
  filters: CmsListFilters,
): boolean {
  if (filters.status && filters.status !== "all" && record.editorial.status !== filters.status) {
    return false;
  }
  const needle = filters.q?.trim().toLowerCase();
  if (!needle) return true;
  return `${record.title} ${record.slug}`.toLowerCase().includes(needle);
}

/**
 * Staff reads. Every method here will require an authenticated staff
 * identity and a server-side role check once it is a real query.
 */
export const contentRepository: ContentRepository = {
  async listPages(filters) {
    const rows = cmsPages().filter((page) => matchesFilters(page, filters));
    return paginate(rows, filters);
  },
  async getPage(id) {
    return cmsPages().find((page) => page.id === id);
  },
  async listArticles(filters) {
    const rows = cmsArticles().filter((article) => matchesFilters(article, filters));
    return paginate(rows, filters);
  },
  async getArticle(id) {
    return cmsArticles().find((article) => article.id === id);
  },
};
