import { isPubliclyVisible } from "@/lib/cms/content-status";
import type {
  CmsArticle,
  CmsPage,
  PublicArticle,
  PublicPage,
} from "@/lib/cms/content-types";
import { jurisdictionLabel } from "@/lib/directory/taxonomy";

/**
 * CMS record → public projection.
 *
 * ## The one job of this module
 * Every mapper returns `undefined` for anything that is not published. That
 * check lives here, once, rather than in each page — a `status === "published"`
 * comparison repeated across six routes is five chances to forget it.
 *
 * ## This is a defence in depth, not the boundary
 * The real boundary is server-side: the authorized query must filter by
 * status in the query itself. If a query ever returned a draft, this mapper
 * would drop it from the render — but the draft would already have crossed
 * the network and be readable in the response. A frontend filter protects
 * the page, not the data.
 *
 * ## Field stripping is structural
 * The public types have no field for a status, an author subject or an
 * internal note, so these mappers cannot copy one across even by accident.
 * That is deliberate: a projection enforced by the type system survives
 * refactors that a hand-written `delete record.status` does not.
 */

export function toPublicArticle(article: CmsArticle): PublicArticle | undefined {
  if (!isPubliclyVisible(article.editorial.status)) return undefined;

  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    category: article.category,
    jurisdictionCode: article.jurisdictionCode,
    jurisdictionLabel: article.jurisdictionCode
      ? jurisdictionLabel(article.jurisdictionCode)
      : undefined,
    featuredImage: article.featuredImage,
    // Display names only. `authorSubject` / `reviewerSubject` are auth
    // identifiers and must never reach a public page.
    author: article.editorial.author,
    reviewer: article.editorial.reviewer,
    reviewedAt: article.editorial.reviewedAt,
    publishedAt: article.editorial.publishedAt,
    seo: article.seo,
  };
}

export function toPublicPage(page: CmsPage): PublicPage | undefined {
  if (!isPubliclyVisible(page.editorial.status)) return undefined;

  return {
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    body: page.body,
    seo: page.seo,
    publishedAt: page.editorial.publishedAt,
  };
}

/** Maps a list, dropping everything unpublished. Order is preserved. */
export function toPublicArticles(articles: CmsArticle[]): PublicArticle[] {
  return articles.flatMap((article) => {
    const mapped = toPublicArticle(article);
    return mapped ? [mapped] : [];
  });
}

/**
 * Published articles that are additionally fit to be public.
 *
 * Stricter than `toPublicArticles` on purpose. Publication status says an
 * editor pressed publish; this adds the tax-content condition that the
 * platform will not show unreviewed tax guidance to the public, regardless
 * of what the status field says. If those two ever disagree, the safer
 * reading wins.
 *
 * The publish mutation must enforce the same rule, so the disagreement
 * should never arise — but "should never arise" is not a reason to render
 * it if it does.
 */
export function toPublishableArticles(articles: CmsArticle[]): PublicArticle[] {
  return toPublicArticles(articles).filter(
    (article) => Boolean(article.reviewer) && Boolean(article.reviewedAt),
  );
}

/** Newest first by publish date; undated records sort last. */
export function byPublishDateDesc(a: PublicArticle, b: PublicArticle): number {
  if (!a.publishedAt && !b.publishedAt) return a.title.localeCompare(b.title);
  if (!a.publishedAt) return 1;
  if (!b.publishedAt) return -1;
  return b.publishedAt.localeCompare(a.publishedAt);
}

/** Distinct categories across a set of public articles, alphabetical. */
export function publicCategories(articles: PublicArticle[]): string[] {
  return [...new Set(articles.map((article) => article.category))].sort((a, b) =>
    a.localeCompare(b),
  );
}
