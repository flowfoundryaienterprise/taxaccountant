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
    authorSubject: v.optional(v.string()),
    reviewerSubject: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
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
    .index("by_created", ["createdAt"]),

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
