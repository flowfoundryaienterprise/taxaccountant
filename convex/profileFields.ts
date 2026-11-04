import { v } from "convex/values";
export const categoryValidator = v.union(v.literal("cpa_accountant"), v.literal("bookkeeper"), v.literal("tax_attorney"), v.literal("wealth_advisor"));
export const onboardingDraftValidator = v.object({
  step: v.number(), category: categoryValidator, displayName: v.string(), businessName: v.string(),
  bio: v.string(), city: v.string(), region: v.string(), countryId: v.optional(v.id("countries")),
  serviceIds: v.array(v.id("serviceCategories")), jurisdictionIds: v.array(v.id("taxJurisdictions")),
  credentials: v.array(v.object({designation: v.string(), issuer: v.string()})),
  remote: v.boolean(),
});
