import type {
  CmsPage_,
  PublicArticle,
  PublicContentRepository,
  PublicPage,
  RepositoryStatus,
} from "@/lib/cms/content-types";

/**
 * The public content repository — and **nothing else**.
 *
 * ## Why this is a separate module from `content-adapter`
 * It was originally one file holding both the staff and public
 * repositories. That gave the public route an import edge to the CMS
 * fixtures, and a production build was measured carrying the article
 * fixture source into the Worker bundle's sourcemaps. The executable JS was
 * clean — the bundler tree-shook the unused data — but that is luck, not
 * design: tree-shaking is an optimisation, not a guarantee, and the same
 * mistake on Day 5 did ship unapproved records into executable code.
 *
 * So the public side imports **no fixture module at all**. There is no
 * import edge for a bundler to follow, which is a stronger property than a
 * filter applied to data that should not be in reach.
 *
 * ## Why it returns nothing
 * No approved, reviewed, published resource exists. The CMS fixtures
 * include articles marked published, but they are fictional tax content,
 * and serving them would put invented guidance on indexable public pages
 * under a real brand.
 *
 * So this reports the truth — the public set is empty — and `/resources`
 * renders its genuine empty state. The gate is not a filter over fictional
 * data; there is simply nothing public yet.
 *
 * ## Replacing this with Convex
 * Swap each body for the corresponding query and update
 * `publicRepositoryStatus`. The queries **must** filter by publication
 * status server-side: the mappers in `@/lib/marketplace/content-mappers`
 * are a second line of defence, not the boundary. Anything the server sends
 * is readable by the caller, whether or not the page renders it.
 */

export const publicRepositoryStatus: RepositoryStatus = {
  backing: "empty",
  detail:
    "no approved, reviewed and published resource exists yet, so the public resource pages are genuinely empty rather than populated with development fixtures.",
};

export const publicContentRepository: PublicContentRepository = {
  async listArticles(): Promise<CmsPage_<PublicArticle>> {
    return { items: [], hasMore: false };
  },
  async getArticle(): Promise<PublicArticle | undefined> {
    return undefined;
  },
  async getPage(): Promise<PublicPage | undefined> {
    return undefined;
  },
  async listCategories(): Promise<string[]> {
    return [];
  },
};
