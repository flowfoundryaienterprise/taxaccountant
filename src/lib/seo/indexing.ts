import type { Metadata } from "next";

/**
 * The single place that decides what this site allows into a search index.
 *
 * ## Why one module
 * Indexing decisions were previously made inline in each route's
 * `generateMetadata`, each with its own comment explaining why. The rules
 * are the same across routes, and the consequence of getting one wrong —
 * publishing fictional people or fabricated coverage into search results —
 * is bad enough that the reasoning deserves one reviewable home.
 *
 * ## The governing rule
 * A route is indexable only when **everything it renders is real**. Most of
 * this site is not there yet: the directory, the country pages and the
 * professional profiles all render Day 3-5 development fixtures describing
 * people and coverage that do not exist. Those stay `noindex` until real
 * data replaces the fixtures — flipping them early would put invented
 * professionals into Google under a real brand.
 *
 * `follow` is kept on almost everything: a page can be unfit to index while
 * its outbound links are still worth crawling. The exception is the CMS,
 * where no link should be followed at all.
 */

export type IndexingDecision = {
  index: boolean;
  follow: boolean;
  /** Why, in plain language. Surfaced in the CMS SEO screen and the docs. */
  reason: string;
};

/** Content renders only real, approved facts. */
export const INDEXABLE: IndexingDecision = {
  index: true,
  follow: true,
  reason: "Indexable — renders only real, approved content.",
};

/** The reason almost every public route is currently excluded. */
export const FIXTURE_BACKED: IndexingDecision = {
  index: false,
  follow: true,
  reason:
    "noindex — renders Day 3-5 development fixtures describing people and coverage that do not exist. Flip to index only when real data replaces them.",
};

export const NOT_PUBLISHED: IndexingDecision = {
  index: false,
  follow: true,
  reason: "noindex — not published, so not eligible to appear in search.",
};

export const COUNTRY_NOT_DISCOVERABLE: IndexingDecision = {
  index: false,
  follow: true,
  reason: "noindex — the country is not open for public discovery.",
};

export const NOT_FOUND_PAGE: IndexingDecision = {
  index: false,
  follow: true,
  reason: "noindex — a not-found response should never be indexed.",
};

/** Phase 2 surface with nothing to offer a searcher yet. */
export const PHASE_GATED: IndexingDecision = {
  index: false,
  follow: true,
  reason: "noindex — explains a capability that has not launched.",
};

/**
 * Staff-only surfaces. `follow: false` as well, because there is nothing
 * behind a CMS link a crawler should pursue.
 *
 * Worth stating plainly: this is **not** what keeps the CMS private. The
 * CMS is stripped from production builds entirely by the
 * `cms-production-exclusion` plugin, and `/admin` returns 404 in a deployed
 * environment. A robots directive is a request to well-behaved crawlers,
 * never an access control.
 */
export const STAFF_ONLY: IndexingDecision = {
  index: false,
  follow: false,
  reason: "noindex, nofollow — staff interface, and excluded from production builds entirely.",
};

/** Converts a decision into the `robots` field of Next.js `Metadata`. */
export function robotsFor(decision: IndexingDecision): Metadata["robots"] {
  return { index: decision.index, follow: decision.follow };
}

/**
 * Query parameters the directory understands.
 *
 * Listed here so the canonical strategy and the robots rules cannot drift
 * from the actual parameter contract in `@/lib/directory/query-params`.
 */
export const DIRECTORY_QUERY_PARAMS = [
  "q",
  "country",
  "city",
  "jurisdiction",
  "service",
  "language",
  "mode",
  "sort",
  "page",
] as const;

/**
 * ## Filtered-search indexing strategy
 *
 * The directory accepts nine independent filter parameters. Multiplied out
 * that is a combinatorially large set of URLs, nearly all of which return
 * near-identical content — the classic faceted-navigation trap, where a
 * crawler burns its budget on permutations instead of real pages.
 *
 * The strategy, in two parts:
 *
 * 1. **Every filtered URL canonicalizes to the bare `/find-accountant`.**
 *    The route already sets a static canonical, so a filtered variant
 *    declares the unfiltered page as the indexable version of itself.
 * 2. **Robots `Disallow` on the query forms**, so crawlers do not spend
 *    requests enumerating them in the first place. Disallow and canonical
 *    do different jobs here — the canonical handles anything already
 *    discovered, the disallow prevents fresh discovery.
 *
 * Shareable filtered links keep working exactly as before: none of this
 * affects a human following a URL, only what a crawler indexes. That
 * preserves the Day 3 requirement that search state lives in the URL.
 *
 * The route is `noindex` today anyway (fixtures), so this strategy matters
 * from the moment real listings land — which is precisely when it would
 * otherwise be forgotten.
 */
export const FILTERED_SEARCH_STRATEGY =
  "Filtered directory URLs canonicalize to /find-accountant and are disallowed in robots.txt; shareable links are unaffected.";
