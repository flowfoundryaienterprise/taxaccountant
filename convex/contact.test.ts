/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { api } from "./_generated/api";
import schema from "./schema";
import { CONSENT_VERSION } from "../src/lib/legal/consent";

const modules = import.meta.glob("./**/*.ts");
const message = {
  kind: "contact" as const,
  name: "Sender",
  email: "sender@example.com",
  message: "I would like to ask about your directory.",
  consentVersion: CONSENT_VERSION,
  sourcePath: "/contact",
};

test("anonymous public messages are validated and limited on the server", async () => {
  const t = convexTest(schema, modules);
  registerRateLimiter(t);
  await expect(t.mutation(api.contact.submitPublicMessage, {...message, sourcePath: "/admin"}))
    .rejects.toThrow("Invalid form source");
  await expect(t.mutation(api.contact.submitPublicMessage, {...message, consentVersion: "old"}))
    .rejects.toThrow("current privacy notice");
  await expect(t.mutation(api.contact.submitPublicMessage, {...message, email: "bad"}))
    .rejects.toThrow("valid email");
  await expect(t.mutation(api.contact.submitPublicMessage, {...message, message: "My SSN is 123-45-6789. Please help."}))
    .rejects.toThrow("Do not include tax or bank identifiers");
  for (let i = 0; i < 3; i++) {
    await expect(t.mutation(api.contact.submitPublicMessage, message)).resolves.toEqual({ok: true});
  }
  await expect(t.mutation(api.contact.submitPublicMessage, message))
    .rejects.toThrow("Too many messages");
  const stored = await t.run(ctx => ctx.db.query("publicMessages").withIndex("by_created").take(10));
  expect(stored).toHaveLength(3);
  expect(stored.every(row => row.email === message.email && row.sourcePath === "/contact")).toBe(true);
});

test("contact submissions are private to active staff", async () => {
  const t = convexTest(schema, modules);
  registerRateLimiter(t);
  await t.mutation(api.contact.submitPublicMessage, message);
  const paginationOpts = {numItems: 10, cursor: null};
  await expect(t.query(api.contact.listMessages, {paginationOpts})).rejects.toThrow();
  const staff = t.withIdentity({subject: "staff", issuer: "https://example.convex.site"});
  await t.run(ctx => ctx.db.insert("staffMemberships", {
    authSubject: "https://example.convex.site|staff",
    role: "cms_editor", active: true, updatedAt: Date.now(),
  }));
  const result = await staff.query(api.contact.listMessages, {paginationOpts});
  expect(result.page).toHaveLength(1);
  expect(result.page[0].message).toBe(message.message);
});

test("a selected published professional remains enquireable beyond the first 50", async () => {
  const t = convexTest(schema, modules);
  const customer = t.withIdentity({subject: "customer", issuer: "https://example.convex.site"});
  await customer.mutation(api.users.ensureAppUser, {role: "customer"});
  const {targetId, hiddenId} = await t.run(async ctx => {
    const countryId = await ctx.db.insert("countries", {
      code: "US", name: "United States", defaultLocale: "en-US", displayCurrency: "USD",
      discoverable: true, onboardingEnabled: true, transactionEnabled: false,
      paymentEnabled: false, status: "published", updatedAt: 1,
    });
    const jurisdictionId = await ctx.db.insert("taxJurisdictions", {
      code: "US-FED", countryId, label: "US Federal", level: "national", active: true,
    });
    const serviceId = await ctx.db.insert("serviceCategories", {
      slug: "tax", name: "Tax", summary: "Tax", sortOrder: 1, publicationStatus: "published", seo: {},
    });
    let targetId = await ctx.db.insert("professionals", {
      slug: "first", displayName: "First", kind: "individual", bio: "Bio",
      approvedProfile: true, verificationStatus: "not_reviewed", publicationStatus: "published",
      remoteServices: true, publicContactMode: "contact_form", featured: false, updatedAt: 1,
    });
    for (let i = 0; i < 51; i++) {
      targetId = await ctx.db.insert("professionals", {
        slug: `later-${i}`, displayName: `Later ${i}`, kind: "individual", bio: "Bio",
        approvedProfile: true, verificationStatus: "not_reviewed", publicationStatus: "published",
        remoteServices: true, publicContactMode: "contact_form", featured: false, updatedAt: 1,
      });
    }
    const hiddenId = await ctx.db.insert("professionals", {
      slug: "hidden", displayName: "Hidden", kind: "individual", bio: "Bio",
      approvedProfile: false, verificationStatus: "rejected", publicationStatus: "published",
      remoteServices: true, publicContactMode: "contact_form", featured: false, updatedAt: 1,
    });
    for (const professionalId of [targetId, hiddenId]) {
      await ctx.db.insert("professionalServices", {
        professionalId, serviceId, taxJurisdictionId: jurisdictionId, enabled: true, remote: true,
      });
    }
    return {targetId, hiddenId};
  });
  const selected = await customer.query(api.contact.enquiryOptions, {professionalId: targetId});
  expect(selected).toHaveLength(1);
  expect(selected[0].serviceSlug).toBe("tax");
  expect(await customer.query(api.contact.enquiryOptions, {professionalId: hiddenId})).toEqual([]);
  expect(await customer.query(api.contact.enquiryOptions, {professionalId: "invalid"})).toEqual([]);
});
