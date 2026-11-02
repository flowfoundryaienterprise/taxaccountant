import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireStaff } from "./staff";
import type { Doc } from "./_generated/dataModel";

/**
 * Staff content reads — the `cms:*` half of `src/lib/cms/content-types.ts`'s
 * `ContentRepository`. Every query here requires an active `staffMemberships`
 * row (`requireStaff`, `convex/staff.ts`): this is the staff side, which can
 * see drafts and editorial metadata, as distinct from `content:*`'s public
 * reads, which can't.
 *
 * `src/lib/cms/content-adapter.ts` already names these exact functions in
 * its own doc comment ("Replace each method body with the corresponding
 * staff query") — `listPages`, `getPage`, `listArticles`, `getArticle` —
 * so this file fulfills that contract rather than inventing a new one.
 */

const PAGE_KINDS = ["page", "guide", "glossary"] as const;

function toCmsPage(doc: Doc<"contentPages">) {
  return {
    id: doc._id,
    slug: doc.slug,
    kind: doc.kind as "page" | "guide" | "glossary",
    title: doc.title,
    summary: doc.summary,
    body: doc.body,
    locale: doc.locale,
    seo: doc.seo,
    editorial: {
      status: doc.status,
      updatedAt: new Date(doc.updatedAt).toISOString(),
    },
  };
}

function toCmsArticle(doc: Doc<"contentPages">) {
  return {
    id: doc._id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.summary,
    body: doc.body,
    category: doc.category ?? "",
    jurisdictionCode: undefined as string | undefined,
    featuredImage: doc.featuredImage,
    locale: doc.locale,
    seo: doc.seo,
    editorial: {
      status: doc.status,
      // Display names, resolved from the auth subject where one is
      // recorded. No display-name directory exists yet (that's Phase 2's
      // `appUsers`), so this shows the raw subject rather than fabricating
      // a name — a real identifier beats an invented one.
      author: doc.authorSubject,
      reviewer: doc.reviewerSubject,
      reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt).toISOString() : undefined,
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
      updatedAt: new Date(doc.updatedAt).toISOString(),
    },
  };
}

export const listPages = query({
  args: {
    q: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    const all = await ctx.db.query("contentPages").collect();
    const pages = all.filter((doc) => (PAGE_KINDS as readonly string[]).includes(doc.kind));

    const needle = args.q?.trim().toLowerCase();
    const filtered = pages.filter((doc) => {
      if (args.status && args.status !== "all" && doc.status !== args.status) return false;
      if (needle && !`${doc.title} ${doc.slug}`.toLowerCase().includes(needle)) return false;
      return true;
    });

    filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    return { items: filtered.map(toCmsPage), hasMore: false };
  },
});

export const getPage = query({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    return doc ? toCmsPage(doc) : undefined;
  },
});

export const listArticles = query({
  args: {
    q: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    const articles = await ctx.db
      .query("contentPages")
      .withIndex("by_kind_status", (q) => q.eq("kind", "blog"))
      .collect();

    const needle = args.q?.trim().toLowerCase();
    const filtered = articles.filter((doc) => {
      if (args.status && args.status !== "all" && doc.status !== args.status) return false;
      if (
        needle &&
        !`${doc.title} ${doc.slug} ${doc.category ?? ""}`.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => b.updatedAt - a.updatedAt);
    return { items: filtered.map(toCmsArticle), hasMore: false };
  },
});

export const getArticle = query({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    return doc && doc.kind === "blog" ? toCmsArticle(doc) : undefined;
  },
});

/** Distinct, non-empty slugs already in use — for the editor's advisory uniqueness check. */
export const existingSlugs = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);
    const all = await ctx.db.query("contentPages").collect();
    return [...new Set(all.map((doc) => doc.slug))];
  },
});
