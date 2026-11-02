import type { CmsArticle, CmsPage, ContentRepository, RepositoryStatus } from "@/lib/cms/content-types";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { AdminArticleRow, AdminPageRow } from "@/lib/admin/admin-types";

/**
 * Staff-side content reads.
 *
 * ## Staff only
 * This module backs `ContentRepository` with real `cms:*` Convex queries
 * (`convex/cms.ts`), called via `fetchAuthQuery` (`@/lib/auth/server`) —
 * the same server-side, session-cookie-derived auth call
 * `src/app/admin/layout.tsx` already uses. Every `cms:*` query itself calls
 * `requireStaff` (`convex/staff.ts`), so an unauthenticated or non-staff
 * caller gets nothing from Convex even if this adapter were somehow reached
 * without the layout's own redirect.
 *
 * **It must only ever be imported by CMS code.** The public counterpart
 * lives in `./public-content-adapter` and imports a different, unauthenticated
 * client — see the note there for why that separation is load-bearing.
 *
 * `cms:listPages`/`cms:listArticles` return every matching row in one
 * response rather than a real cursor page (Convex-side `.collect()`) — fine
 * at Phase 1's content volume; a genuine cursor would matter once editorial
 * content scales past what one query page comfortably returns.
 */

export const staffRepositoryStatus: RepositoryStatus = {
  backing: "convex",
  detail: "cms:listPages / cms:listArticles, gated by requireStaff.",
};

export const contentRepository: ContentRepository = {
  async listPages(filters) {
    return fetchAuthQuery(api.cms.listPages, {
      q: filters.q,
      status: filters.status,
    });
  },
  async getPage(id) {
    const result = await fetchAuthQuery(api.cms.getPage, { id: id as Id<"contentPages"> });
    return result ?? undefined;
  },
  async listArticles(filters) {
    return fetchAuthQuery(api.cms.listArticles, {
      q: filters.q,
      status: filters.status,
    });
  },
  async getArticle(id) {
    const result = await fetchAuthQuery(api.cms.getArticle, { id: id as Id<"contentPages"> });
    return result ?? undefined;
  },
};

/**
 * Flattens the staff `CmsPage`/`CmsArticle` contract into the
 * `AdminPageRow`/`AdminArticleRow` shape the list screens, the editor forms
 * and `admin-list.ts`'s generic table helpers already consume — so wiring
 * real Convex data in didn't require touching those components' field
 * access. `provenance` is always `"approved"` now: these are real
 * `contentPages` rows, not fixtures.
 */
export function toAdminPageRow(page: CmsPage): AdminPageRow {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    kind: page.kind,
    status: page.editorial.status,
    locale: page.locale,
    summary: page.summary,
    body: page.body,
    seo: page.seo,
    updatedAt: page.editorial.updatedAt,
    provenance: "approved",
  };
}

export function toAdminArticleRow(article: CmsArticle): AdminArticleRow {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category,
    author: article.editorial.author,
    reviewer: article.editorial.reviewer,
    reviewedAt: article.editorial.reviewedAt,
    status: article.editorial.status,
    excerpt: article.excerpt,
    body: article.body,
    jurisdictionCode: article.jurisdictionCode,
    featuredImage: article.featuredImage,
    seo: article.seo,
    publishedAt: article.editorial.publishedAt,
    updatedAt: article.editorial.updatedAt,
    provenance: "approved",
  };
}
