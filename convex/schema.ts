import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Phase 1 schema only. Source of truth: documents/DATABASE.md section 2.
 * Phase 2-5 collections (appUsers, organizations, leads, quotes, etc.) are
 * documented there but intentionally not created yet — see DATABASE.md
 * sections 3-6 and PRD.md section 3 (phase gates).
 *
 * Better Auth owns identity/session/credential storage in its own Convex
 * component; this schema never shadow-copies that data (DATABASE.md section 1).
 */

const seoFields = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  canonicalPath: v.optional(v.string()),
  ogImagePath: v.optional(v.string()),
});

export default defineSchema({
  // ---------------------------------------------------------------------
  // Geography and taxonomy
  // ---------------------------------------------------------------------
  countries: defineTable({
    code: v.string(), // ISO 3166-1 alpha-2
    name: v.string(),
    defaultLocale: v.string(),
    displayCurrency: v.string(),
    discoverable: v.boolean(),
    onboardingEnabled: v.boolean(),
    transactionEnabled: v.boolean(),
    paymentEnabled: v.boolean(),
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("published"),
      v.literal("disabled"),
    ),
    /*
     * Day 4 addition. `/countries/[countryCode]` needs a unique title,
     * meta description and canonical path per country, exactly as
     * `serviceCategories` already has for `/services/[slug]`. The field was
     * simply missing from the country side of the same requirement
     * (DATABASE.md section 2 lists `seo:obj` on serviceCategories and
     * contentPages but not countries).
     *
     * Optional, so no existing `countries` document becomes invalid and no
     * backfill is required — a country with no `seo` falls back to the
     * generated defaults the page already produces.
     */
    seo: v.optional(seoFields),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_discoverable_status", ["discoverable", "status"]),

  taxJurisdictions: defineTable({
    code: v.string(),
    countryId: v.id("countries"),
    label: v.string(),
    level: v.union(
      v.literal("national"),
      v.literal("state"),
      v.literal("province"),
      v.literal("local"),
      v.literal("other"),
    ),
    parentId: v.optional(v.id("taxJurisdictions")),
    active: v.boolean(),
  })
    .index("by_country", ["countryId"])
    .index("by_code", ["code"]),

  serviceCategories: defineTable({
    slug: v.string(),
    name: v.string(),
    summary: v.string(),
    parentId: v.optional(v.id("serviceCategories")),
    sortOrder: v.number(),
    publicationStatus: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    seo: seoFields,
  })
    .index("by_slug", ["slug"])
    .index("by_publication_status", ["publicationStatus"]),

  languages: defineTable({
    code: v.string(), // BCP-47
    label: v.string(),
    enabled: v.boolean(),
  }).index("by_code", ["code"]),

  // ---------------------------------------------------------------------
  // Professionals and search (public directory contract, DATABASE.md L35)
  // ---------------------------------------------------------------------
  professionals: defineTable({
    slug: v.string(),
    displayName: v.string(),
    kind: v.union(v.literal("individual"), v.literal("firm")),
    firmName: v.optional(v.string()),
    bio: v.string(),
    approvedProfile: v.boolean(),
    verificationStatus: v.union(
      v.literal("not_reviewed"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    publicationStatus: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("published"),
      v.literal("suspended"),
      v.literal("archived"),
    ),
    remoteServices: v.boolean(),
    /*
     * Day 5 addition. `remoteServices` alone cannot distinguish "remote
     * only" from "remote or in person", and a `professionalLocations` row is
     * a statement about geography, not an offer to meet clients there — so
     * inferring in-person availability from a location would invent a
     * consultation preference nobody declared.
     *
     * Both the Day 3 directory's consultation-mode filter
     * (`?mode=in_person`) and the Day 5 profile's consultation section are
     * already specified against this fact (DESIGN.md section 6: "languages,
     * location and remote indication"), and it was simply missing from the
     * professional record.
     *
     * Optional, so no existing `professionals` document becomes invalid and
     * no backfill is required — a profile that has never stated a position
     * renders as "not stated" rather than as a guess.
     */
    inPersonServices: v.optional(v.boolean()),
    publicContactMode: v.union(
      v.literal("contact_form"),
      v.literal("external"),
      v.literal("none"),
    ),
    featured: v.boolean(),
    sourceApprovalRef: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_publication_status", ["publicationStatus"])
    .index("by_featured", ["featured"]),

  professionalServices: defineTable({
    professionalId: v.id("professionals"),
    serviceId: v.id("serviceCategories"),
    taxJurisdictionId: v.id("taxJurisdictions"),
    enabled: v.boolean(),
    description: v.optional(v.string()),
    remote: v.boolean(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_service_jurisdiction", ["serviceId", "taxJurisdictionId"])
    .index("by_jurisdiction_service", ["taxJurisdictionId", "serviceId"]),

  professionalLocations: defineTable({
    professionalId: v.id("professionals"),
    countryId: v.id("countries"),
    city: v.string(),
    region: v.optional(v.string()),
    publicLocationText: v.optional(v.string()),
    isPrimary: v.boolean(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_country_city", ["countryId", "city"]),

  professionalLanguages: defineTable({
    professionalId: v.id("professionals"),
    languageId: v.id("languages"),
  })
    .index("by_professional", ["professionalId"])
    .index("by_language", ["languageId"]),

  professionalPublicCredentials: defineTable({
    professionalId: v.id("professionals"),
    designation: v.string(),
    issuer: v.optional(v.string()),
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
    publicDisplayStatus: v.union(
      v.literal("unverified"),
      v.literal("verified"),
      v.literal("expired"),
    ),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    sourceRef: v.optional(v.string()),
  }).index("by_professional", ["professionalId"]),

  // ---------------------------------------------------------------------
  // CMS and public messages
  // ---------------------------------------------------------------------
  contentPages: defineTable({
    slug: v.string(),
    kind: v.union(
      v.literal("page"),
      v.literal("blog"),
      v.literal("guide"),
      v.literal("glossary"),
      v.literal("country_service"),
      v.literal("city_service"),
    ),
    title: v.string(),
    summary: v.optional(v.string()),
    // Structured safe rich text; exact block schema is a CMS-editor design
    // decision for later in Phase 1 (IMPLEMENTATION_PLAN.md day 16-17).
    body: v.any(),
    countryId: v.optional(v.id("countries")),
    serviceId: v.optional(v.id("serviceCategories")),
    locale: v.string(),
    seo: seoFields,
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("published"),
      v.literal("archived"),
    ),
    /*
     * Day 7 addition. `contentPages` could already say which country and
     * which service a page relates to, but not which tax jurisdiction —
     * even though that is the distinction this whole product is built on.
     *
     * It matters most for editorial content: an article describing one tax
     * authority's treatment of something, rendered without saying which
     * authority, reads as a universal statement. That is the specific harm
     * the Day 7 brief's tax-content rules exist to prevent ("No unreviewed
     * jurisdiction-specific tax advice", section 10), and it cannot be
     * prevented if the record has nowhere to say what it applies to.
     *
     * Optional: most pages are genuinely not jurisdiction-specific, and an
     * absent value means "not jurisdiction-specific" rather than "unknown".
     */
    jurisdictionId: v.optional(v.id("taxJurisdictions")),
    authorSubject: v.optional(v.string()),
    reviewerSubject: v.optional(v.string()),
    /*
     * Day 7 addition. `reviewerSubject` records *who* reviewed; `publishedAt`
     * records when the content went live. Neither answers "when was this
     * last checked against current practice", which for tax content is a
     * different and more important question — content can be published for a
     * year after its last review.
     *
     * The Day 7 brief requires the two to be distinguishable (section 10:
     * "Distinguish publish date from last-reviewed date"), and the public
     * resource pages are expected to show a reviewed date where one exists.
     *
     * Optional, so no existing document becomes invalid: an absent value
     * means no review has been recorded, which the UI must render as
     * "not reviewed" rather than falling back to the publish date.
     */
    reviewedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
    /*
     * Added alongside the first real `cms:*`/`content:*` mutations
     * (convex/cms.ts, convex/content.ts). `AdminArticleRow.category` and
     * `.featuredImage` (src/lib/admin/admin-types.ts) needed somewhere to
     * live once articles could actually be saved.
     *
     * `category` is a plain string, not a `contentCategories` join row —
     * the editor form is a single-select (one category per article), so a
     * many-to-many join would add write/read complexity (insert/delete join
     * rows, resolve on every read) for a relationship the UI never
     * exercises as many-to-many. `contentCategories`/`contentPageCategories`
     * stay defined and unused, reserved for if admin-managed, multi-category
     * taxonomy is ever actually needed.
     *
     * `featuredImage` is an embedded `{path, alt}` rather than a
     * `mediaAssets` reference, matching what `MediaPicker` actually produces
     * today — a `public/` path string, because the R2 upload integration
     * that would make a real `mediaAssets` row meaningful doesn't exist yet.
     */
    category: v.optional(v.string()),
    featuredImage: v.optional(v.object({ path: v.string(), alt: v.string() })),
  })
    .index("by_slug_locale", ["slug", "locale"])
    .index("by_kind_status", ["kind", "status"])
    .index("by_country_kind", ["countryId", "kind"]),

  contentCategories: defineTable({
    slug: v.string(),
    label: v.string(),
    kind: v.union(v.literal("resource"), v.literal("blog"), v.literal("guide")),
    sortOrder: v.number(),
  }).index("by_slug_kind", ["slug", "kind"]),

  contentPageCategories: defineTable({
    pageId: v.id("contentPages"),
    categoryId: v.id("contentCategories"),
  })
    .index("by_page", ["pageId"])
    .index("by_category", ["categoryId"]),

  mediaAssets: defineTable({
    objectKey: v.string(),
    bucketClass: v.union(v.literal("public_media"), v.literal("private")),
    ownerSubject: v.optional(v.string()),
    contentType: v.string(),
    sizeBytes: v.number(),
    altText: v.optional(v.string()),
    scanStatus: v.union(
      v.literal("pending"),
      v.literal("clean"),
      v.literal("blocked"),
      v.literal("not_required"),
    ),
    approvalStatus: v.union(v.literal("draft"), v.literal("approved"), v.literal("rejected")),
    visibility: v.union(v.literal("private"), v.literal("public")),
    uploadedAt: v.number(),
  })
    .index("by_object_key", ["objectKey"])
    .index("by_owner", ["ownerSubject"])
    .index("by_approval_visibility", ["approvalStatus", "visibility"]),

  siteSettings: defineTable({
    key: v.string(),
    // Allowlisted, non-secret configuration values only (DATABASE.md L45).
    value: v.any(),
    updatedAt: v.number(),
    updatedBySubject: v.optional(v.string()),
  }).index("by_key", ["key"]),

  publicMessages: defineTable({
    kind: v.union(v.literal("contact"), v.literal("professional_interest")),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    serviceId: v.optional(v.id("serviceCategories")),
    message: v.string(),
    consentVersion: v.string(),
    sourcePath: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("reviewing"),
      v.literal("closed"),
      v.literal("spam"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_kind_status_created", ["kind", "status", "createdAt"])
    .index("by_created", ["createdAt"])
    /*
     * Added alongside the admin Messages inbox (`convex/contact.ts`
     * `listMessages`): the inbox filters by status alone (across both
     * `kind`s), which `by_kind_status_created` cannot serve — Convex
     * requires querying indexed fields in their declared order, and `kind`
     * comes first in that one. Small additive index, not a backfill risk
     * (`publicMessages` has at most a handful of rows today).
     */
    .index("by_status_created", ["status", "createdAt"]),

  auditEvents: defineTable({
    actorSubject: v.optional(v.string()),
    actorRole: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    // Redacted metadata only — never message text or private tax data
    // (AGENTS.md section 5).
    metadata: v.any(),
    createdAt: v.number(),
  })
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_actor_created", ["actorSubject", "createdAt"])
    .index("by_created", ["createdAt"]),

  // Phase 1 minimum CMS staff mapping (DATABASE.md L49). Better Auth owns
  // the actual identity/session; this only maps a subject to a CMS role.
  staffMemberships: defineTable({
    authSubject: v.string(),
    role: v.union(v.literal("cms_admin"), v.literal("cms_editor")),
    active: v.boolean(),
    invitedBy: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_auth_subject", ["authSubject"]),
});
