import { v } from "convex/values";

import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireStaff } from "./staff";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * `content:*` — the editorial-workflow mutations `src/lib/cms/content-status.ts`
 * already names (`content:saveDraft`, `content:requestReview`,
 * `content:publish`, `content:unpublish`) plus the public reads
 * `src/lib/cms/content-types.ts`'s `PublicContentRepository` names
 * (`content:listPublishedResources`, `content:getPublishedBySlug`).
 *
 * ## Server-side validation is not optional
 * `documents/API.md` section 1: "Inputs validated server-side using Convex
 * validators and shared form validation; never trust UI-only checks."
 * `src/lib/admin/admin-validation.ts` and `src/lib/cms/content-validation.ts`
 * run the same rules client-side for immediate feedback — those are a
 * convenience for the editor, not the boundary. A caller that skips the
 * form (a script, a different client) must hit the same checks here.
 *
 * ## Review is a recorded action, not a form field
 * `src/components/admin/article-editor-form.tsx`'s own comment: reviewer
 * fields are "displayed from the record and would be written by an
 * authorized review action." `recordReview` is that action — separate from
 * `publish`, because recording a review and making content public are two
 * different facts, and `publish` from `review` status re-checks that a
 * review was already recorded rather than performing one implicitly.
 */

const TITLE_MAX = 120;
const SLUG_MAX = 80;
const SUMMARY_MAX = 300;
const SEO_TITLE_MAX = 60;
const SEO_DESCRIPTION_MAX = 160;
const ALT_TEXT_MAX = 160;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const seoArg = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  canonicalPath: v.optional(v.string()),
  ogImagePath: v.optional(v.string()),
});

function assertWithinLimits(fields: { label: string; value: string | undefined; max: number }[]) {
  for (const { label, value, max } of fields) {
    if (value && value.length > max) {
      throw new Error(`${label} must be ${max} characters or fewer (currently ${value.length}).`);
    }
  }
}

async function assertUniqueSlug(
  ctx: QueryCtx,
  slug: string,
  locale: string,
  excludeId?: Id<"contentPages">,
) {
  const existing = await ctx.db
    .query("contentPages")
    .withIndex("by_slug_locale", (q) => q.eq("slug", slug).eq("locale", locale))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`"${slug}" is already in use for locale "${locale}". Slugs must be unique.`);
  }
}

/**
 * Create-or-update, never changing `status` — the save path every editorial
 * state can reach (`content-status.ts`'s `saveDraft` transition is legal
 * `from: ["draft", "review", "published", "archived"]`, which is really
 * "from anything", because saving the current edits is always allowed).
 */
export const saveDraft = mutation({
  args: {
    id: v.optional(v.id("contentPages")),
    kind: v.union(
      v.literal("page"),
      v.literal("blog"),
      v.literal("guide"),
      v.literal("glossary"),
      v.literal("country_service"),
      v.literal("city_service"),
    ),
    title: v.string(),
    slug: v.string(),
    summary: v.optional(v.string()),
    body: v.any(),
    seo: seoArg,
    category: v.optional(v.string()),
    featuredImage: v.optional(v.object({ path: v.string(), alt: v.string() })),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);

    const title = args.title.trim();
    const slug = args.slug.trim();
    const locale = args.locale?.trim() || "en";

    if (!title) throw new Error("Title is required.");
    if (!slug) throw new Error("URL slug is required.");
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(
        "URL slug may use lowercase letters, numbers and single hyphens only.",
      );
    }
    assertWithinLimits([
      { label: "Title", value: title, max: TITLE_MAX },
      { label: "URL slug", value: slug, max: SLUG_MAX },
      { label: "Summary", value: args.summary, max: SUMMARY_MAX },
      { label: "SEO title", value: args.seo.title, max: SEO_TITLE_MAX },
      { label: "Meta description", value: args.seo.description, max: SEO_DESCRIPTION_MAX },
    ]);
    if (args.featuredImage) {
      const alt = args.featuredImage.alt.trim();
      if (!alt) throw new Error("Image alt text is required whenever a featured image is set.");
      assertWithinLimits([{ label: "Image alt text", value: alt, max: ALT_TEXT_MAX }]);
    }

    await assertUniqueSlug(ctx, slug, locale, args.id);

    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Content record not found.");

      await ctx.db.patch(args.id, {
        title,
        slug,
        summary: args.summary?.trim() || undefined,
        body: args.body,
        seo: args.seo,
        category: args.category?.trim() || undefined,
        featuredImage: args.featuredImage,
        locale,
        updatedAt: now,
      });
      return { id: args.id };
    }

    const id = await ctx.db.insert("contentPages", {
      kind: args.kind,
      title,
      slug,
      summary: args.summary?.trim() || undefined,
      body: args.body,
      locale,
      seo: args.seo,
      status: "draft",
      category: args.category?.trim() || undefined,
      featuredImage: args.featuredImage,
      authorSubject: staff.authSubject,
      updatedAt: now,
    });
    return { id };
  },
});

export const requestReview = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "draft") {
      throw new Error(`Cannot submit for review from status "${doc.status}".`);
    }
    await ctx.db.patch(args.id, { status: "review", updatedAt: Date.now() });
  },
});

export const returnToDraft = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "review") {
      throw new Error(`Cannot return to draft from status "${doc.status}".`);
    }
    await ctx.db.patch(args.id, { status: "draft", updatedAt: Date.now() });
  },
});

/**
 * Records that the signed-in staff member has reviewed this content — not a
 * status change. Separate from `publish` so "reviewed" and "public" stay
 * two distinct, independently-true facts.
 */
export const recordReview = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "review") {
      throw new Error("Only content currently in review can be marked reviewed.");
    }
    await ctx.db.patch(args.id, {
      reviewerSubject: staff.authSubject,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

function bodyIsEmpty(body: unknown): boolean {
  if (!Array.isArray(body)) return true;
  return !body.some((block) => {
    if (!block || typeof block !== "object") return false;
    if (block.type === "list") return Array.isArray(block.items) && block.items.some((item: string) => item.trim());
    return typeof block.text === "string" && block.text.trim().length > 0;
  });
}

/**
 * review → published. Re-runs the blocker-level checks from
 * `src/lib/cms/content-validation.ts` server-side — the client-side version
 * exists for immediate feedback, this one is the actual gate.
 */
export const publish = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "review") {
      throw new Error(`Cannot publish from status "${doc.status}". Content must be in review.`);
    }
    if (!doc.title.trim()) throw new Error("Cannot publish: the content has no title.");
    if (!doc.slug.trim()) throw new Error("Cannot publish: the content has no URL slug.");
    if (bodyIsEmpty(doc.body)) throw new Error("Cannot publish: the content body is empty.");

    if (doc.kind === "blog") {
      if (!doc.category?.trim()) throw new Error("Cannot publish: the article has no category.");
      if (!doc.reviewerSubject || !doc.reviewedAt) {
        throw new Error(
          "Cannot publish: no editorial review has been recorded. Use \"Mark reviewed\" first.",
        );
      }
      if (doc.featuredImage && !doc.featuredImage.alt.trim()) {
        throw new Error("Cannot publish: the featured image has no alt text.");
      }
    }

    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const unpublish = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "published") {
      throw new Error(`Cannot unpublish from status "${doc.status}".`);
    }
    await ctx.db.patch(args.id, { status: "draft", updatedAt: Date.now() });
  },
});

export const archive = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");
    if (doc.status !== "draft" && doc.status !== "published") {
      throw new Error(`Cannot archive from status "${doc.status}".`);
    }
    await ctx.db.patch(args.id, { status: "archived", updatedAt: Date.now() });
  },
});

/**
 * Hard delete — `cms_admin` only. `DeleteConfirmation`'s own copy calls out
 * what a real delete needs: "an authorized mutation and an audit record,
 * neither of which exists yet." This is both.
 */
export const deleteContent = mutation({
  args: { id: v.id("contentPages") },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);
    if (staff.role !== "cms_admin") {
      throw new Error("Only a CMS admin may delete content.");
    }
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Content record not found.");

    await ctx.db.delete(args.id);
    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "contentPages.deleted",
      resourceType: "contentPages",
      resourceId: args.id,
      metadata: { title: doc.title, slug: doc.slug, status: doc.status, kind: doc.kind },
      createdAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Public reads — no auth, published-only, filtered server-side
// ---------------------------------------------------------------------------

function toPublicArticle(doc: Doc<"contentPages">) {
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.summary,
    body: doc.body,
    category: doc.category ?? "",
    jurisdictionCode: undefined as string | undefined,
    jurisdictionLabel: undefined as string | undefined,
    featuredImage: doc.featuredImage,
    author: doc.authorSubject,
    reviewer: doc.reviewerSubject,
    reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt).toISOString() : undefined,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
    seo: doc.seo,
  };
}

function toPublicPage(doc: Doc<"contentPages">) {
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    body: doc.body,
    seo: doc.seo,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
  };
}

export const listPublishedResources = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const published = await ctx.db
      .query("contentPages")
      .withIndex("by_kind_status", (q) => q.eq("kind", "blog").eq("status", "published"))
      .collect();

    let items = published;
    if (args.category) {
      items = items.filter((doc) => doc.category === args.category);
    }
    items.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    if (args.limit) items = items.slice(0, args.limit);

    return { items: items.map(toPublicArticle), hasMore: false };
  },
});

/**
 * One function serving both `getArticle(slug)` and `getPage(slug)` in
 * `PublicContentRepository` — `content-types.ts` names both as
 * `content:getPublishedBySlug`. The caller narrows by `kind`.
 */
export const getPublishedBySlug = query({
  args: { slug: v.string(), locale: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const locale = args.locale ?? "en";
    const doc = await ctx.db
      .query("contentPages")
      .withIndex("by_slug_locale", (q) => q.eq("slug", args.slug).eq("locale", locale))
      .unique();

    if (!doc || doc.status !== "published") return undefined;

    return doc.kind === "blog"
      ? { kind: "article" as const, article: toPublicArticle(doc) }
      : { kind: "page" as const, page: toPublicPage(doc) };
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("contentPages")
      .withIndex("by_kind_status", (q) => q.eq("kind", "blog").eq("status", "published"))
      .collect();
    return [...new Set(published.map((doc) => doc.category).filter((c): c is string => Boolean(c)))];
  },
});
