import type { CmsBlock, CmsSeo, PublicArticle, PublicPage } from "@/lib/cms/content-types";

/**
 * View models for the public content pages.
 *
 * The underlying public projections live in `@/lib/cms/content-types` and
 * are re-exported here so public components import from one place and never
 * reach into the CMS modules — which is the import direction that would let
 * a staff type, and the draft fields it carries, drift onto a public page.
 *
 * Nothing is redefined below: a second copy of `PublicArticle` would be a
 * second thing to keep in sync, and the point of the projection is that
 * there is exactly one.
 */
export type { CmsBlock, CmsSeo, PublicArticle, PublicPage };

/** A resource card on `/resources`. Strictly narrower than the detail view. */
export interface ResourceCardModel {
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  jurisdictionLabel?: string;
  image?: { path: string; alt: string };
  publishedAt?: string;
  reviewedAt?: string;
}

export function toResourceCard(article: PublicArticle): ResourceCardModel {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    jurisdictionLabel: article.jurisdictionLabel,
    image: article.featuredImage,
    publishedAt: article.publishedAt,
    reviewedAt: article.reviewedAt,
  };
}

export const RESOURCES_PATH = "/resources";

export const resourceHref = (slug: string) => `${RESOURCES_PATH}/${slug}`;
