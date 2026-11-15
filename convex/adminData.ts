import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireStaff } from "./staff";

const professionalRow = v.object({
  id: v.string(), slug: v.string(), displayName: v.string(),
  firmName: v.optional(v.string()), bio: v.string(), kind: v.union(v.literal("individual"), v.literal("firm")),
  countryCode: v.string(), city: v.string(), serviceSlugs: v.array(v.string()),
  jurisdictionCodes: v.array(v.string()), languageCodes: v.array(v.string()),
  credentials: v.array(v.object({ designation: v.string(), issuer: v.optional(v.string()), status: v.union(v.literal("unverified"), v.literal("verified"), v.literal("expired")), reviewedAt: v.optional(v.number()) })),
  status: v.union(v.literal("draft"), v.literal("review"), v.literal("published"), v.literal("suspended"), v.literal("archived")),
  verificationStatus: v.union(v.literal("not_reviewed"), v.literal("pending"), v.literal("verified"), v.literal("rejected"), v.literal("expired")),
  approvedProfile: v.boolean(), credentialsReviewed: v.boolean(),
});

async function projectProfessional(ctx: QueryCtx, profile: Doc<"professionals">) {
  const [locations, offerings, languageRows, credentials] = await Promise.all([
    ctx.db.query("professionalLocations").withIndex("by_professional", q => q.eq("professionalId", profile._id)).take(20),
    ctx.db.query("professionalServices").withIndex("by_professional", q => q.eq("professionalId", profile._id)).take(100),
    ctx.db.query("professionalLanguages").withIndex("by_professional", q => q.eq("professionalId", profile._id)).take(30),
    ctx.db.query("professionalPublicCredentials").withIndex("by_professional", q => q.eq("professionalId", profile._id)).take(30),
  ]);
  const location = locations.find(row => row.isPrimary) ?? locations[0];
  const country = location ? await ctx.db.get(location.countryId) : null;
  const active = offerings.filter(row => row.enabled);
  const [services, jurisdictions, languages] = await Promise.all([
    Promise.all(active.map(row => ctx.db.get(row.serviceId))),
    Promise.all(active.map(row => ctx.db.get(row.taxJurisdictionId))),
    Promise.all(languageRows.map(row => ctx.db.get(row.languageId))),
  ]);
  return {
    id: profile._id, slug: profile.slug, displayName: profile.displayName,
    firmName: profile.firmName, bio: profile.bio, kind: profile.kind,
    countryCode: country?.code ?? "", city: location?.city ?? "",
    serviceSlugs: [...new Set(services.filter(row => row !== null).map(row => row.slug))],
    jurisdictionCodes: [...new Set(jurisdictions.filter(row => row !== null).map(row => row.code))],
    languageCodes: [...new Set(languages.filter(row => row !== null).map(row => row.code))],
    credentials: credentials.map(row => ({ designation: row.designation, issuer: row.issuer, status: row.publicDisplayStatus, reviewedAt: row.reviewedAt })),
    status: profile.publicationStatus, verificationStatus: profile.verificationStatus,
    approvedProfile: profile.approvedProfile,
    credentialsReviewed: credentials.some(row => row.publicDisplayStatus === "verified" && row.reviewedAt !== undefined),
  };
}

export const listProfessionals = query({
  args: {},
  returns: v.object({ items: v.array(professionalRow), limited: v.boolean() }),
  handler: async ctx => {
    await requireStaff(ctx);
    const profiles = await ctx.db.query("professionals").order("desc").take(101);
    return { items: await Promise.all(profiles.slice(0, 100).map(row => projectProfessional(ctx, row))), limited: profiles.length > 100 };
  },
});

export const getProfessional = query({
  args: { slug: v.string() },
  returns: v.union(professionalRow, v.null()),
  handler: async (ctx, { slug }) => {
    await requireStaff(ctx);
    if (slug.length > 160) return null;
    const profile = await ctx.db.query("professionals").withIndex("by_slug", q => q.eq("slug", slug)).unique();
    return profile ? await projectProfessional(ctx, profile) : null;
  },
});

const mediaRow = v.object({
  id: v.id("mediaAssets"), objectKey: v.string(), path: v.optional(v.string()),
  contentType: v.string(), sizeBytes: v.number(), altText: v.optional(v.string()),
  approvalStatus: v.union(v.literal("draft"), v.literal("approved"), v.literal("rejected")),
  visibility: v.union(v.literal("private"), v.literal("public")),
});

function publicPath(asset: Doc<"mediaAssets">) {
  return asset.visibility === "public" && asset.approvalStatus === "approved" &&
    asset.scanStatus === "clean" && /^\/images\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|svg)$/i.test(asset.objectKey)
    ? asset.objectKey : undefined;
}

export const listMedia = query({
  args: {},
  returns: v.object({ items: v.array(mediaRow), limited: v.boolean() }),
  handler: async ctx => {
    await requireStaff(ctx);
    const assets = await ctx.db.query("mediaAssets").order("desc").take(101);
    return { items: assets.slice(0, 100).map(asset => ({
      id: asset._id, objectKey: asset.objectKey, path: publicPath(asset),
      contentType: asset.contentType, sizeBytes: asset.sizeBytes, altText: asset.altText,
      approvalStatus: asset.approvalStatus, visibility: asset.visibility,
    })), limited: assets.length > 100 };
  },
});

export const selectableMedia = query({
  args: {},
  returns: v.array(v.object({ id: v.id("mediaAssets"), path: v.string(), altText: v.string() })),
  handler: async ctx => {
    await requireStaff(ctx);
    const assets = await ctx.db.query("mediaAssets")
      .withIndex("by_approval_visibility", q => q.eq("approvalStatus", "approved").eq("visibility", "public"))
      .take(100);
    return assets.flatMap(asset => {
      const path = publicPath(asset);
      return path && asset.altText ? [{ id: asset._id, path, altText: asset.altText }] : [];
    });
  },
});

const settingKeys = ["brandName", "metaTitleTemplate", "siteDescription", "siteOrigin", "contactEmail", "contactRoute", "socialLinks", "primaryNav", "footerContent", "displayLanguages", "displayCurrencies", "featuredContent"] as const;

export const listSettings = query({
  args: {},
  returns: v.array(v.object({ key: v.string(), value: v.string(), updatedAt: v.number() })),
  handler: async ctx => {
    await requireStaff(ctx);
    const rows = await Promise.all(settingKeys.map(key => ctx.db.query("siteSettings").withIndex("by_key", q => q.eq("key", key)).unique()));
    return rows.filter((row): row is NonNullable<typeof row> => row !== null)
      .filter(row => typeof row.value === "string" || typeof row.value === "number" || typeof row.value === "boolean")
      .map(row => ({ key: row.key, value: String(row.value), updatedAt: row.updatedAt }));
  },
});
