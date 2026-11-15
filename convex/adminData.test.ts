/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("admin data requires active staff and returns stored records without private media URLs", async () => {
  const t = convexTest(schema, modules);
  const staff = t.withIdentity({ subject: "editor", issuer: "https://example.convex.site" });
  await t.run(async ctx => {
    await ctx.db.insert("staffMemberships", {
      authSubject: "https://example.convex.site|editor", role: "cms_editor", active: true, updatedAt: 1,
    });
    await ctx.db.insert("professionals", {
      slug: "draft-profile", displayName: "Draft Profile", kind: "individual", bio: "Draft bio",
      approvedProfile: false, verificationStatus: "not_reviewed", publicationStatus: "draft",
      remoteServices: false, publicContactMode: "none", featured: false, updatedAt: 1,
    });
    await ctx.db.insert("mediaAssets", {
      objectKey: "private/tax-document.pdf", bucketClass: "private", contentType: "application/pdf",
      sizeBytes: 100, scanStatus: "clean", approvalStatus: "draft", visibility: "private", uploadedAt: 1,
    });
    await ctx.db.insert("siteSettings", { key: "brandName", value: "TaxAccountant.com", updatedAt: 1 });
    await ctx.db.insert("siteSettings", { key: "SECRET_KEY", value: "must-not-render", updatedAt: 1 });
  });

  await expect(t.query(api.adminData.listProfessionals, {})).rejects.toThrow();
  await expect(t.query(api.adminData.listMedia, {})).rejects.toThrow();
  await expect(t.query(api.adminData.listSettings, {})).rejects.toThrow();
  const profiles = await staff.query(api.adminData.listProfessionals, {});
  expect(profiles.items.map(row => row.slug)).toEqual(["draft-profile"]);
  expect(await staff.query(api.adminData.getProfessional, { slug: "draft-profile" })).toMatchObject({ status: "draft", approvedProfile: false });
  const media = await staff.query(api.adminData.listMedia, {});
  expect(media.items[0]).toMatchObject({ objectKey: "private/tax-document.pdf", visibility: "private" });
  expect(media.items[0].path).toBeUndefined();
  expect(await staff.query(api.adminData.selectableMedia, {})).toEqual([]);
  expect(await staff.query(api.adminData.listSettings, {})).toEqual([{ key: "brandName", value: "TaxAccountant.com", updatedAt: 1 }]);
}, 20_000);
