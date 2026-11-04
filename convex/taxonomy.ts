import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Taxonomy reference-data queries and dev seed (Phase 2, P2-W2,
 * task-9-brief.md Step 0).
 *
 * `countries`/`taxJurisdictions`/`serviceCategories`/`languages` are Phase 1
 * tables (DATABASE.md section 2) that were never actually populated, and no
 * Convex query ever existed to list them — `API.md` section 2 names
 * `countries:listDiscoverable`/`jurisdictions:listByCountry`/
 * `services:listPublished` as planned Phase 1 functions, but none of the
 * three were ever built, and no seed ever ran (confirmed via
 * `npx convex data <table>` returning no documents for all four tables).
 * The onboarding wizard's services/locations/languages steps need real
 * `Id<...>` values to submit to Task 6's mutations, so this file closes both
 * gaps at once: four small public list queries, plus a dev-only seed
 * mutation that never runs automatically and is never reachable from any
 * client surface (same shape as `convex/devProvision.ts`'s bootstrap).
 *
 * These four queries use a plain `.collect()` (two of them `.collect()` the
 * whole table, two use an index first) rather than `.take()`/pagination,
 * because every one of these four tables is a small, bounded reference list
 * curated by staff, not a table that grows with user activity (the Convex
 * guidelines' "always bound with `.take()`" rule targets unbounded
 * user-generated tables).
 *
 * Query names deliberately differ from the `countries:listDiscoverable` /
 * `jurisdictions:listByCountry` / `services:listPublished` names API.md
 * planned: those three names belong to three separate modules
 * (`countries.ts`, `jurisdictions.ts`, `services.ts`) that don't exist yet,
 * and splitting four small picker queries across three new files for one
 * wizard is more surface area than this task needs. `domain:verb` naming
 * (API.md section 1) is kept, with `taxonomy` as the one domain for all four.
 */

export const listCountries = query({
  args: {},
  handler: async (ctx) => {
    const countries = await ctx.db.query("countries").collect();
    return countries
      .filter((country) => country.onboardingEnabled)
      .map((country) => ({
        countryId: country._id,
        code: country.code,
        name: country.name,
      }));
  },
});

export const listTaxJurisdictions = query({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    const jurisdictions = await ctx.db
      .query("taxJurisdictions")
      .withIndex("by_country", (q) => q.eq("countryId", args.countryId))
      .collect();
    return jurisdictions
      .filter((jurisdiction) => jurisdiction.active)
      .map((jurisdiction) => ({
        jurisdictionId: jurisdiction._id,
        code: jurisdiction.code,
        label: jurisdiction.label,
        level: jurisdiction.level,
      }));
  },
});

export const listServiceCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("serviceCategories")
      .withIndex("by_publication_status", (q) => q.eq("publicationStatus", "published"))
      .collect();
    return categories
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        serviceId: category._id,
        slug: category.slug,
        name: category.name,
      }));
  },
});

export const listLanguages = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();
    return languages
      .filter((language) => language.enabled)
      .map((language) => ({
        languageId: language._id,
        code: language.code,
        label: language.label,
      }));
  },
});

/*
 * Seed data below. Every value is real reference data, not an invented
 * fixture (AGENTS.md section 5 "no fabricated content" / section 9 "never
 * publish test fixtures in a way that misleads" — this is taxonomy data
 * about countries/jurisdictions/services/languages, not a claim about any
 * real professional, credential or business):
 *
 * - Countries: the same eight countries `src/lib/home-content.ts`'s
 *   `searchCountries` (re-exported by `src/lib/directory/taxonomy.ts` as
 *   `countryOptions`) already names, with their real ISO 3166-1 alpha-2
 *   codes, real ISO 4217 currency codes, and real BCP-47 default locales.
 * - Tax jurisdictions: exactly `src/lib/directory/taxonomy.ts`'s existing
 *   `jurisdictionOptions` fixture — same codes, same labels, same country
 *   associations — so the wizard's jurisdiction picker lines up with what
 *   the rest of the app already shows.
 * - Service categories: the nine named categories from `PRD.md` §P1-F05
 *   ("Individual tax, business tax, international tax, bookkeeping,
 *   payroll, tax planning, audits/support, entity formation, amended
 *   returns"), reusing `src/lib/home-content.ts`'s `services` fixture for
 *   slug/title/summary on the eight categories that already exist there.
 *   "Entity formation" has no fixture counterpart yet, so it gets a new
 *   slug/summary in the same style as the other eight.
 * - Languages: a small subset of `src/lib/directory/taxonomy.ts`'s
 *   `languageOptions` fixture, with real BCP-47 codes and matching labels.
 */

const SEED_COUNTRIES: Array<{
  code: string;
  name: string;
  defaultLocale: string;
  displayCurrency: string;
}> = [
  { code: "US", name: "United States", defaultLocale: "en-US", displayCurrency: "USD" },
  { code: "CA", name: "Canada", defaultLocale: "en-CA", displayCurrency: "CAD" },
  { code: "GB", name: "United Kingdom", defaultLocale: "en-GB", displayCurrency: "GBP" },
  { code: "IN", name: "India", defaultLocale: "en-IN", displayCurrency: "INR" },
  { code: "AU", name: "Australia", defaultLocale: "en-AU", displayCurrency: "AUD" },
  { code: "DE", name: "Germany", defaultLocale: "de-DE", displayCurrency: "EUR" },
  { code: "SG", name: "Singapore", defaultLocale: "en-SG", displayCurrency: "SGD" },
  { code: "AE", name: "United Arab Emirates", defaultLocale: "ar-AE", displayCurrency: "AED" },
];

type JurisdictionLevel = "national" | "state" | "province" | "local" | "other";

const SEED_JURISDICTIONS: Array<{
  code: string;
  countryCode: string;
  label: string;
  level: JurisdictionLevel;
}> = [
  { code: "US-FED", countryCode: "US", label: "United States — Federal (IRS)", level: "national" },
  { code: "US-CA", countryCode: "US", label: "California (FTB)", level: "state" },
  { code: "US-NY", countryCode: "US", label: "New York State (DTF)", level: "state" },
  { code: "CA-FED", countryCode: "CA", label: "Canada — Federal (CRA)", level: "national" },
  { code: "CA-ON", countryCode: "CA", label: "Ontario", level: "province" },
  { code: "GB-HMRC", countryCode: "GB", label: "United Kingdom (HMRC)", level: "national" },
  { code: "IN-CBDT", countryCode: "IN", label: "India — Income Tax (CBDT)", level: "national" },
  { code: "IN-GST", countryCode: "IN", label: "India — GST", level: "national" },
  { code: "AU-ATO", countryCode: "AU", label: "Australia (ATO)", level: "national" },
  { code: "DE-BZST", countryCode: "DE", label: "Germany (BZSt)", level: "national" },
  { code: "SG-IRAS", countryCode: "SG", label: "Singapore (IRAS)", level: "national" },
  { code: "AE-FTA", countryCode: "AE", label: "United Arab Emirates (FTA)", level: "national" },
];

const SEED_SERVICE_CATEGORIES: Array<{
  slug: string;
  name: string;
  summary: string;
}> = [
  {
    slug: "individual-tax-preparation",
    name: "Individual Tax Preparation",
    summary: "Annual filing support for residents, expatriates and dual-status filers",
  },
  {
    slug: "business-tax-services",
    name: "Business Tax Services",
    summary: "Corporate, partnership and entity-level filing across jurisdictions",
  },
  {
    slug: "international-tax-services",
    name: "International Tax Services",
    summary: "Cross-border income, treaty positions and foreign reporting obligations",
  },
  {
    slug: "bookkeeping-accounting",
    name: "Bookkeeping & Accounting",
    summary: "Ongoing ledgers, reconciliations and financial statement preparation",
  },
  {
    slug: "payroll-services",
    name: "Payroll Services",
    summary: "Multi-jurisdiction payroll processing, withholding and filings",
  },
  {
    slug: "tax-planning-advisory",
    name: "Tax Planning & Advisory",
    summary: "Forward-looking structuring and liability planning with a licensed advisor",
  },
  {
    slug: "irs-tax-audit-support",
    name: "Tax Audit Support",
    summary: "Representation and documentation support through an active audit",
  },
  {
    slug: "entity-formation",
    name: "Entity Formation",
    summary: "Formation filings and registered-agent support for LLCs, corporations and partnerships",
  },
  {
    slug: "amended-tax-returns",
    name: "Amended Tax Returns",
    summary: "Corrections and refiling for previously submitted returns",
  },
];

const SEED_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Mandarin Chinese" },
];

/**
 * One-off dev bootstrap: `npx convex run taxonomy:seedDevTaxonomy '{}'`
 * against the dev deployment only — never production, and never called
 * automatically by any cron, mutation or client code. `internalMutation`
 * only, mirroring `convex/devProvision.ts`'s `signUpStaff`: not registered
 * through `api`, so no client surface can reach it.
 *
 * Idempotent: every insert is preceded by a check against that table's
 * unique-code index (`by_code` for countries/jurisdictions/languages,
 * `by_slug` for serviceCategories), so re-running this after rows already
 * exist inserts nothing new and is safe to run more than once.
 */
export const seedDevTaxonomy = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const countryIdByCode: Record<string, Id<"countries">> = {};
    let countriesInserted = 0;
    for (const country of SEED_COUNTRIES) {
      const existing = await ctx.db
        .query("countries")
        .withIndex("by_code", (q) => q.eq("code", country.code))
        .unique();
      if (existing) {
        countryIdByCode[country.code] = existing._id;
        continue;
      }
      const countryId = await ctx.db.insert("countries", {
        code: country.code,
        name: country.name,
        defaultLocale: country.defaultLocale,
        displayCurrency: country.displayCurrency,
        discoverable: true,
        onboardingEnabled: true,
        transactionEnabled: false,
        paymentEnabled: false,
        status: "published",
        updatedAt: now,
      });
      countryIdByCode[country.code] = countryId;
      countriesInserted += 1;
    }

    let jurisdictionsInserted = 0;
    for (const jurisdiction of SEED_JURISDICTIONS) {
      const existing = await ctx.db
        .query("taxJurisdictions")
        .withIndex("by_code", (q) => q.eq("code", jurisdiction.code))
        .unique();
      if (existing) continue;

      const countryId = countryIdByCode[jurisdiction.countryCode];
      if (!countryId) {
        throw new Error(`Seed order error: unknown country code ${jurisdiction.countryCode}`);
      }

      await ctx.db.insert("taxJurisdictions", {
        code: jurisdiction.code,
        countryId,
        label: jurisdiction.label,
        level: jurisdiction.level,
        active: true,
      });
      jurisdictionsInserted += 1;
    }

    let servicesInserted = 0;
    for (const [index, service] of SEED_SERVICE_CATEGORIES.entries()) {
      const existing = await ctx.db
        .query("serviceCategories")
        .withIndex("by_slug", (q) => q.eq("slug", service.slug))
        .unique();
      if (existing) continue;

      await ctx.db.insert("serviceCategories", {
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        sortOrder: index,
        publicationStatus: "published",
        seo: {},
      });
      servicesInserted += 1;
    }

    let languagesInserted = 0;
    for (const language of SEED_LANGUAGES) {
      const existing = await ctx.db
        .query("languages")
        .withIndex("by_code", (q) => q.eq("code", language.code))
        .unique();
      if (existing) continue;

      await ctx.db.insert("languages", {
        code: language.code,
        label: language.label,
        enabled: true,
      });
      languagesInserted += 1;
    }

    return { countriesInserted, jurisdictionsInserted, servicesInserted, languagesInserted };
  },
});
