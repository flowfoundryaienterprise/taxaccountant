/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("public search pages approved profiles and keeps country separate from jurisdiction", async () => {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    const countryId = await ctx.db.insert("countries", {
      code: "CA", name: "Canada", defaultLocale: "en-CA", displayCurrency: "CAD",
      discoverable: true, onboardingEnabled: true, transactionEnabled: false,
      paymentEnabled: false, status: "published", updatedAt: 1,
    });
    const serviceId = await ctx.db.insert("serviceCategories", {
      slug: "tax", name: "Tax", summary: "Tax", sortOrder: 0,
      publicationStatus: "published", seo: {},
    });
    const jurisdictionId = await ctx.db.insert("taxJurisdictions", {
      code: "CA-FED", countryId, label: "Canada Federal", level: "national", active: true,
    });
    for (const [name, approved] of [["Alice", true], ["Bob", true], ["Hidden", false]] as const) {
      const professionalId = await ctx.db.insert("professionals", {
        slug: name.toLowerCase(), displayName: name, kind: "individual", bio: "Bio",
        approvedProfile: approved, verificationStatus: "not_reviewed",
        publicationStatus: "published", remoteServices: true, publicContactMode: "none",
        featured: false, updatedAt: 1,
      });
      await ctx.db.insert("professionalLocations", {
        professionalId, countryId, city: "Toronto", isPrimary: true,
      });
      await ctx.db.insert("professionalServices", {
        professionalId, serviceId, taxJurisdictionId: jurisdictionId,
        enabled: true, remote: true,
      });
    }
  });

  const first = await t.query(api.professionals.search, {
    paginationOpts: { numItems: 1, cursor: null }, countryCode: "CA",
    taxJurisdictionCode: "CA-FED", serviceSlug: "tax",
  });
  expect(first.page).toHaveLength(1);
  expect(first.page[0].countryCode).toBe("CA");
  expect(first.page[0].jurisdictionCodes).toEqual(["CA-FED"]);
  expect(first.isDone).toBe(false);
  const second = await t.query(api.professionals.search, {
    paginationOpts: { numItems: 1, cursor: first.continueCursor }, countryCode: "CA",
  });
  expect(second.page).toHaveLength(1);
  expect(second.page[0].slug).not.toBe(first.page[0].slug);
  expect(second.isDone).toBe(true);
  const wrongJurisdiction = await t.query(api.professionals.search, {
    paginationOpts: { numItems: 10, cursor: null }, countryCode: "CA",
    taxJurisdictionCode: "US-FED",
  });
  expect(wrongJurisdiction.page).toEqual([]);
  expect(await t.query(api.professionals.publicProfile, { slug: "hidden" })).toBeNull();
});
