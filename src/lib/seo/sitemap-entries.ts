import { publicContentRepository } from "@/lib/cms/public-content-adapter";
import { resourceHref } from "@/lib/marketplace/public-content-types";
import { serviceCatalogSlugs } from "@/lib/marketplace/services";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * The sitemap's contents, as data.
 *
 * Kept separate from the route handler that serializes it so the rule set
 * is reviewable on its own, and so it can move to a Next.js `sitemap.ts`
 * unchanged if vinext ever supports that convention (it does not today —
 * see the route handler for the measurement).
 *
 * ## The rule
 * **A URL belongs here only if it is indexable and returns 200.** That is
 * the single easiest thing to get wrong in this project, because two
 * sources disagree about what "published" means:
 *
 *  - the **CMS** holds articles marked `published` — fictional
 *    demonstration fixtures; and
 *  - the **public repository** serves what a reader can actually reach,
 *    which is currently nothing.
 *
 * Generating from the CMS would list URLs that 404 for every crawler that
 * followed them. This reads `publicContentRepository`, the same source
 * `/resources` renders from, so the two cannot disagree by construction.
 *
 * ## Deliberate exclusions
 *
 * | Excluded | Why |
 * |---|---|
 * | `/find-accountant` | `noindex` — development fixtures |
 * | `/countries`, `/countries/[code]` | `noindex` — coverage derived from fixtures |
 * | `/professionals/[slug]` | `noindex` — listing them would publish invented people |
 * | `/for-professionals` | `noindex` — explains an unlaunched capability |
 * | `/admin/*` | staff interface, absent from production builds |
 * | `/sign-in`, `/api/*` | nothing for a searcher |
 * | `/privacy`, `/terms` | `noindex` — placeholder pending legal review, not real policy yet |
 * | Filtered `/find-accountant?...` | faceted-navigation trap |
 *
 * Each mirrors a decision in `@/lib/seo/indexing`. A sitemap that
 * contradicts a page's own robots directive gives a crawler two opposite
 * instructions.
 *
 * ## No fabricated timestamps
 * `lastModified` appears only where a real date exists. Service and
 * marketing routes are code, not records, so they carry none rather than
 * `new Date()` — which would claim every page changed on every build and
 * teach crawlers to ignore the field.
 */
export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/resources"), changeFrequency: "weekly", priority: 0.7 },
    // Real, honest, indexable content pages (Day 11) — each one's own
    // `robots` export already agrees (INDEXABLE from `@/lib/seo/indexing`).
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/how-it-works"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/help"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
  ];

  // The eight approved service categories: live, indexable, and describing
  // real categories of work.
  for (const slug of serviceCatalogSlugs) {
    entries.push({
      url: absoluteUrl(`/services/${slug}`),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  /*
   * Published resources, read from the public repository — the same read
   * `/resources` performs. Returns nothing today, so no resource URL is
   * listed, which is correct: there is no published resource to crawl.
   *
   * `lastModified` prefers the review date over the publish date: for tax
   * content the review is the meaningful "this was checked" signal.
   */
  const { items } = await publicContentRepository.listArticles();
  for (const article of items) {
    const modified = article.reviewedAt ?? article.publishedAt;
    entries.push({
      url: absoluteUrl(resourceHref(article.slug)),
      ...(modified ? { lastModified: modified } : {}),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  return entries;
}
