import type { EditorialAction } from "@/lib/cms/content-status";
import type { CmsArticle, CmsBlock, CmsPage } from "@/lib/cms/content-types";

/**
 * Publish-readiness checks.
 *
 * Distinct from `@/lib/admin/admin-validation`, which answers "is this field
 * well-formed". This module answers a different and later question: "is this
 * content fit to be made public". A record can be perfectly valid and still
 * be unfit to publish — an article with no recorded review is the obvious
 * case.
 *
 * ## These are advisory, and the server must repeat them
 * API.md section 1: "Inputs validated server-side using Convex validators
 * and shared form validation; never trust UI-only checks." Everything here
 * exists to stop an editor wasting a round trip and to make the rules
 * reviewable before the backend is written. The publish mutation must
 * enforce the same list, because a caller that skips the UI skips these.
 */

export type BlockerSeverity = "blocker" | "warning";

export interface PublishIssue {
  severity: BlockerSeverity;
  /** Which editorial action this prevents, when it is a blocker. */
  action: EditorialAction;
  message: string;
}

/** Collapses the issue list into the shape the action bar consumes. */
export function toActionBlockers(
  issues: PublishIssue[],
): Partial<Record<EditorialAction, string>> {
  const blockers: Partial<Record<EditorialAction, string>> = {};
  for (const issue of issues) {
    if (issue.severity !== "blocker") continue;
    // First blocker per action wins; the summary lists the rest.
    blockers[issue.action] ??= issue.message;
  }
  return blockers;
}

const hasText = (value: string | undefined) => Boolean(value && value.trim());

function bodyIsEmpty(body: CmsBlock[]): boolean {
  return !body.some((block) => {
    if (block.type === "list") return block.items.some((item) => item.trim());
    return block.text.trim().length > 0;
  });
}

/**
 * Publish checks common to every content type.
 *
 * The SEO description is a warning rather than a blocker: a missing one
 * degrades the search result, it does not mislead anyone. The title, slug
 * and body are blockers because publishing an empty page is never intended.
 */
function commonIssues(input: {
  title: string;
  slug: string;
  body: CmsBlock[];
  seoDescription?: string;
}): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!hasText(input.title)) {
    issues.push({ severity: "blocker", action: "publish", message: "The content has no title." });
  }
  if (!hasText(input.slug)) {
    issues.push({ severity: "blocker", action: "publish", message: "The content has no URL slug." });
  }
  if (bodyIsEmpty(input.body)) {
    issues.push({
      severity: "blocker",
      action: "publish",
      message: "The content body is empty. Publishing an empty page is almost never intended.",
    });
  }
  if (!hasText(input.seoDescription)) {
    issues.push({
      severity: "warning",
      action: "publish",
      message:
        "No meta description. Search engines will choose their own excerpt, which is usually worse than a written one.",
    });
  }

  return issues;
}

export function pagePublishIssues(page: {
  title: string;
  slug: string;
  body: CmsBlock[];
  seo: { description?: string };
}): PublishIssue[] {
  return commonIssues({
    title: page.title,
    slug: page.slug,
    body: page.body,
    seoDescription: page.seo.description,
  });
}

/**
 * Article publish checks, including the tax-content rules.
 *
 * Two of these are the reason this module exists at all:
 *
 *  - **No recorded review blocks publication.** Tax content carries real
 *    consequences for the person reading it, and an author attributing
 *    their own work is not a review. The Day 7 brief states it directly:
 *    "No unreviewed jurisdiction-specific tax advice."
 *  - **A review must be attributable and dated.** A reviewer name with no
 *    date, or a date with no reviewer, is not a review record — it is a
 *    half-filled field, and treating it as sufficient would defeat the
 *    check entirely.
 *
 * An image without alt text is also a blocker, not a warning: shipping an
 * inaccessible image to the public site is a defect, not a preference.
 */
export function articlePublishIssues(article: {
  title: string;
  slug: string;
  body: CmsBlock[];
  category: string;
  seo: { description?: string };
  featuredImage?: { path: string; alt: string };
  editorial: { reviewer?: string; reviewedAt?: string };
}): PublishIssue[] {
  const issues = commonIssues({
    title: article.title,
    slug: article.slug,
    body: article.body,
    seoDescription: article.seo.description,
  });

  if (!hasText(article.category)) {
    issues.push({
      severity: "blocker",
      action: "publish",
      message: "The article has no category.",
    });
  }

  const hasReviewer = hasText(article.editorial.reviewer);
  const hasReviewDate = hasText(article.editorial.reviewedAt);

  if (!hasReviewer || !hasReviewDate) {
    issues.push({
      severity: "blocker",
      action: "publish",
      message: !hasReviewer && !hasReviewDate
        ? "No editorial review has been recorded. Tax content must be reviewed by an authorized professional before it is published."
        : !hasReviewer
          ? "A review date is recorded but no reviewer. An unattributable review is not a review."
          : "A reviewer is recorded but no review date. Without a date there is no way to tell how current the review is.",
    });
  }

  if (article.featuredImage && !hasText(article.featuredImage.alt)) {
    issues.push({
      severity: "blocker",
      action: "publish",
      message: "The featured image has no alt text.",
    });
  }

  return issues;
}

/** Convenience wrappers for records already in CMS shape. */
export const issuesForPage = (page: CmsPage) =>
  pagePublishIssues({ title: page.title, slug: page.slug, body: page.body, seo: page.seo });

export const issuesForArticle = (article: CmsArticle) =>
  articlePublishIssues({
    title: article.title,
    slug: article.slug,
    body: article.body,
    category: article.category,
    seo: article.seo,
    featuredImage: article.featuredImage,
    editorial: article.editorial,
  });

export const blockersOnly = (issues: PublishIssue[]) =>
  issues.filter((issue) => issue.severity === "blocker");

export const warningsOnly = (issues: PublishIssue[]) =>
  issues.filter((issue) => issue.severity === "warning");
