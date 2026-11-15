import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const publicListing = v.object({
  professionalId:v.id("professionals"),slug:v.string(),displayName:v.string(),kind:v.union(v.literal("individual"),v.literal("firm")),firmName:v.optional(v.string()),bio:v.string(),
  city:v.string(),countryCode:v.string(),region:v.string(),remote:v.boolean(),inPerson:v.boolean(),photo:v.optional(v.string()),photoAlt:v.string(),fixtureOrder:v.number(),
  credentials:v.array(v.object({designation:v.string(),status:v.union(v.literal("unverified"),v.literal("verified"),v.literal("expired"))})),
  serviceSlugs:v.array(v.string()),serviceNames:v.array(v.string()),jurisdictionCodes:v.array(v.string()),jurisdictionNames:v.array(v.string()),languageCodes:v.array(v.string()),
  acceptingEnquiries:v.boolean(),
});

/** Explicit public projection: drafts, feedback and ownership records are never returned. */
async function projectListing(ctx:QueryCtx,profile:Doc<"professionals">,offeringLimit=20) {
  if(profile.publicationStatus!=="published" || !profile.approvedProfile) return null;
  const locations=await ctx.db.query("professionalLocations").withIndex("by_professional",q=>q.eq("professionalId",profile._id)).take(10);
  const location=locations.find(l=>l.isPrimary)??locations[0];
  const country=location?await ctx.db.get(location.countryId):null;
  if(!location || !country || !country.discoverable || country.status!=="published") return null;
  const offerings=await ctx.db.query("professionalServices").withIndex("by_professional",q=>q.eq("professionalId",profile._id)).take(offeringLimit);
  const active=await Promise.all(offerings.filter(o=>o.enabled).map(async o=>{
    const service=await ctx.db.get(o.serviceId);const jurisdiction=await ctx.db.get(o.taxJurisdictionId);
    if(service?.publicationStatus!=="published" || !jurisdiction?.active || jurisdiction.countryId!==country._id)return null;
    return {service,jurisdiction};
  }));
  const available=active.filter(o=>o!==null);
  const credentials=await ctx.db.query("professionalPublicCredentials").withIndex("by_professional",q=>q.eq("professionalId",profile._id)).take(10);
  const languageRows=await ctx.db.query("professionalLanguages").withIndex("by_professional",q=>q.eq("professionalId",profile._id)).take(10);
  const languages=await Promise.all(languageRows.map(l=>ctx.db.get(l.languageId)));
  return {professionalId:profile._id,slug:profile.slug,displayName:profile.displayName,kind:profile.kind,firmName:profile.firmName,bio:profile.bio,acceptingEnquiries:profile.publicContactMode==="contact_form",
    city:location.city,region:location.region??"",countryCode:country.code,remote:profile.remoteServices,inPerson:profile.inPersonServices??false,
    photo:profile.profilePhotoId?(await ctx.storage.getUrl(profile.profilePhotoId))??undefined:undefined,photoAlt:`Portrait of ${profile.displayName}`,fixtureOrder:profile._creationTime,
    credentials:credentials.map(c=>({designation:c.designation,status:c.publicDisplayStatus==="verified"&&!c.reviewedAt?"unverified" as const:c.publicDisplayStatus})),
    serviceSlugs:[...new Set(available.map(o=>o.service.slug))],serviceNames:[...new Set(available.map(o=>o.service.name))],
    jurisdictionCodes:[...new Set(available.map(o=>o.jurisdiction.code))],jurisdictionNames:[...new Set(available.map(o=>o.jurisdiction.label))],languageCodes:languages.filter(l=>l?.enabled).map(l=>l!.code)};
}
export const publishedDirectory = query({
  args:{},returns:v.object({items:v.array(publicListing),limited:v.boolean()}),
  handler:async ctx=>{
    const candidates=await ctx.db.query("professionals").withIndex("by_publication_approval",q=>q.eq("publicationStatus","published").eq("approvedProfile",true)).order("desc").take(101);
    const items=[];
    for(const candidate of candidates.slice(0,100)){const item=await projectListing(ctx,candidate);if(item)items.push(item);}
    return {items,limited:candidates.length>100};
  },
});

/** A bounded page of approved listings. Filters are applied to the public
 * projection, so a location never stands in for tax jurisdiction coverage. */
export const search = query({
  args: {
    paginationOpts: paginationOptsValidator,
    q: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    taxJurisdictionCode: v.optional(v.string()),
    serviceSlug: v.optional(v.string()),
    language: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("remote"), v.literal("in_person"))),
  },
  returns: v.object({
    page: v.array(publicListing),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems > 50 || args.paginationOpts.numItems < 1) {
      throw new Error("Page size must be between 1 and 50");
    }
    if ((args.q?.length ?? 0) > 120) throw new Error("Search text is too long");
    const candidates = await ctx.db.query("professionals")
      .withIndex("by_publication_approval", q => q.eq("publicationStatus", "published").eq("approvedProfile", true))
      .order("desc")
      .paginate(args.paginationOpts);
    const needle = args.q?.trim().toLocaleLowerCase();
    const projected = await Promise.all(candidates.page.map(candidate => projectListing(ctx, candidate)));
    const page = projected.filter((item): item is NonNullable<typeof item> => item !== null).filter(item => {
      if (args.countryCode && item.countryCode !== args.countryCode.toUpperCase()) return false;
      if (args.taxJurisdictionCode && !item.jurisdictionCodes.includes(args.taxJurisdictionCode)) return false;
      if (args.serviceSlug && !item.serviceSlugs.includes(args.serviceSlug)) return false;
      if (args.language && !item.languageCodes.includes(args.language)) return false;
      if (args.mode === "remote" && !item.remote) return false;
      if (args.mode === "in_person" && !item.inPerson) return false;
      if (needle) {
        const searchable = [item.displayName, item.firmName ?? "", item.city,
          ...item.credentials.map(c => c.designation), ...item.serviceNames,
          ...item.jurisdictionNames].join(" ").toLocaleLowerCase();
        if (!needle.split(/\s+/).every(term => searchable.includes(term))) return false;
      }
      return true;
    });
    return { page, continueCursor: candidates.continueCursor, isDone: candidates.isDone };
  },
});
export const publicProfile = query({
  args:{slug:v.string()},returns:v.union(publicListing,v.null()),
  handler:async(ctx,{slug})=>{
    if(slug.length>160)return null;
    const profile=await ctx.db.query("professionals").withIndex("by_slug",q=>q.eq("slug",slug)).unique();
    return profile?projectListing(ctx,profile,600):null;
  },
});

/**
 * Minimal public professional-directory query — a prerequisite Task 5's
 * design doc assumed already existed but doesn't (Phase 2, P2-W2 plan,
 * task-5-brief.md). Exists so `requestProfessionalClaim` (convex/
 * professionalOwnership.ts) has a published professional to find and claim,
 * via a search surface a real "claim an existing listing" UI (Task 7) can
 * call directly.
 */

const MAX_CANDIDATES_SCANNED = 200;
const MAX_RESULTS = 20;

/**
 * Substring-matches `nameQuery` against `displayName`/`firmName`, scoped to
 * published listings only via the `by_publication_status` index. Bounded on
 * both ends: `.take(MAX_CANDIDATES_SCANNED)` keeps the index scan itself
 * bounded (never an unbounded `.collect()` over every published
 * professional), and the substring filter that runs over those candidates is
 * capped to `MAX_RESULTS` matches. The published-professional directory is
 * expected to stay small relative to this bound (AGENTS.md); it is not a
 * general full-text search over an unbounded table.
 */
export const searchPublishedProfessionals = query({
  args: { nameQuery: v.string() },
  handler: async (ctx, args) => {
    const needle = args.nameQuery.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    const candidates = await ctx.db
      .query("professionals")
      .withIndex("by_publication_status", (q) => q.eq("publicationStatus", "published"))
      .take(MAX_CANDIDATES_SCANNED);

    const matches = candidates.filter((professional) => {
      if (!professional.approvedProfile) return false;
      const displayName = professional.displayName.toLowerCase();
      const firmName = professional.firmName?.toLowerCase() ?? "";
      return displayName.includes(needle) || firmName.includes(needle);
    });

    return matches.slice(0, MAX_RESULTS).map((professional) => ({
      professionalId: professional._id,
      displayName: professional.displayName,
      firmName: professional.firmName,
      slug: professional.slug,
    }));
  },
});
