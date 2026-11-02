import type {
  CmsPage_,
  PublicArticle,
  PublicContentRepository,
  PublicPage,
  RepositoryStatus,
} from "@/lib/cms/content-types";
import { publicConvexClient } from "@/lib/convex/public-client";
import { api } from "@/convex/_generated/api";

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
 * So the public side imports **no fixture module at all**, still. It now
 * imports `@/convex/_generated/api` and a plain, unauthenticated
 * `ConvexHttpClient` (`@/lib/convex/public-client`) instead — not a fixture,
 * and not `src/lib/cms/content-adapter.ts`'s staff-only module, which this
 * file must never import for the same reason it never imported the fixtures.
 *
 * ## Why the boundary still holds
 * `content:listPublishedResources` and `content:getPublishedBySlug`
 * (`convex/content.ts`) filter to `status: "published"` **in the query
 * itself**, not in this adapter. Anything the server sends is readable by
 * the caller whether or not this file re-filters it, so the authorization
 * boundary is the Convex query, and this file is a thin shape-mapper in
 * front of it.
 *
 * Demonstration articles (`src/lib/admin/admin-fixtures.ts`) are
 * deliberately never seeded into real `contentPages` rows as "published" —
 * they are fictional, unreviewed tax content, and publishing them for real
 * would put invented guidance on an indexable public page under a real
 * brand. So this now genuinely reads Convex, and still returns nothing
 * until a staff member writes and publishes real content through
 * `/admin/articles` or `/admin/pages`.
 */

export const publicRepositoryStatus: RepositoryStatus = {
  backing: "convex",
  detail: "content:listPublishedResources / content:getPublishedBySlug, filtered to published rows server-side.",
};

export const publicContentRepository: PublicContentRepository = {
  async listArticles(options): Promise<CmsPage_<PublicArticle>> {
    const result = await publicConvexClient.query(api.content.listPublishedResources, {
      category: options?.category,
      limit: options?.limit,
    });
    return { items: result.items, hasMore: result.hasMore };
  },
  async getArticle(slug): Promise<PublicArticle | undefined> {
    const result = await publicConvexClient.query(api.content.getPublishedBySlug, { slug });
    return result?.kind === "article" ? result.article : undefined;
  },
  async getPage(slug): Promise<PublicPage | undefined> {
    const result = await publicConvexClient.query(api.content.getPublishedBySlug, { slug });
    return result?.kind === "page" ? result.page : undefined;
  },
  async listCategories(): Promise<string[]> {
    return publicConvexClient.query(api.content.listCategories, {});
  },
};
