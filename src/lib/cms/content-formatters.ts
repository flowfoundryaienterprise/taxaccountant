import type { CmsBlock } from "@/lib/cms/content-types";

/**
 * Formatting shared by the CMS editors and the public content pages.
 *
 * One module so an editor previewing an article and a reader viewing the
 * published version see the same text rendered the same way — a preview that
 * formats differently from the live page is not a preview.
 */

/** Fixed, unambiguous date. Never relative ("3 days ago"), which hides the value. */
export function formatContentDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * The dateline shown on a published article.
 *
 * Publish date and last-reviewed date are reported separately and are never
 * merged or substituted for one another. For tax content the gap between
 * them is information the reader needs: an article published two years ago
 * and reviewed last month is in a very different state from the reverse, and
 * showing one date labelled ambiguously hides exactly that.
 *
 * When no review has been recorded, this says so rather than falling back to
 * the publish date.
 */
export interface ContentDateline {
  published?: string;
  reviewed?: string;
  /** True when no review has been recorded — rendered as a caution. */
  unreviewed: boolean;
}

export function contentDateline(input: {
  publishedAt?: string;
  reviewedAt?: string;
}): ContentDateline {
  return {
    published: formatContentDate(input.publishedAt),
    reviewed: formatContentDate(input.reviewedAt),
    unreviewed: !input.reviewedAt,
  };
}

/** Plain-text length of a block array, for reading-time-free summaries. */
export function blockTextLength(body: CmsBlock[]): number {
  return body.reduce((total, block) => {
    if (block.type === "list") {
      return total + block.items.join(" ").length;
    }
    return total + block.text.length;
  }, 0);
}

/** First non-empty paragraph, used as an excerpt fallback. */
export function firstParagraph(body: CmsBlock[]): string | undefined {
  const paragraph = body.find(
    (block) => block.type === "paragraph" && block.text.trim().length > 0,
  );
  return paragraph && paragraph.type === "paragraph" ? paragraph.text : undefined;
}

/**
 * The standing disclaimer on every published tax resource.
 *
 * Not optional and not per-article: the platform publishes no rates,
 * thresholds or deadlines anywhere, and every resource needs to say what it
 * is and is not. Kept here so one wording is reviewed once rather than
 * re-typed per page.
 */
export const TAX_CONTENT_DISCLAIMER =
  "General information only. This is not advice about your own tax position, and it does not state the rules of any particular tax authority. Rates, thresholds and deadlines are not published on this site — confirm anything that affects you with a professional authorized for the jurisdiction you file in.";

/**
 * The extra caution shown when an article is scoped to one jurisdiction, so
 * a reader does not carry its content across a border it does not apply to.
 */
export function jurisdictionNotice(jurisdictionLabel: string): string {
  return `This resource was written about ${jurisdictionLabel}. It does not describe the position in any other tax jurisdiction, and the treatment elsewhere is frequently different.`;
}
