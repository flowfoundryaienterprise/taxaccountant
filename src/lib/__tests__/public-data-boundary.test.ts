import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { getFunctionName, type FunctionReference } from "convex/server";

import {
  getPublishedProfile,
  publishedProfileSlugs,
  publishedProfiles,
} from "@/lib/professionals/profile-fixtures";
import { getCountry, isDiscoverable, discoverableCountryCodes } from "@/lib/marketplace/countries";
import { getService, serviceCatalogSlugs } from "@/lib/marketplace/services";
// This adapter/sitemap unit suite must not depend on a live deployment being empty.
// A non-routable client origin plus a strict query mock prevents network access.
process.env.NEXT_PUBLIC_CONVEX_URL = "https://unit-test.convex.cloud";
const { publicConvexClient } = await import("@/lib/convex/public-client");
mock.method(publicConvexClient, "query", async (reference: FunctionReference<"query">) => {
  switch (getFunctionName(reference)) {
    case "content:listPublishedResources": return { items: [], hasMore: false };
    case "content:getPublishedBySlug": return null;
    case "content:listCategories": return [];
    default: throw new Error("Unexpected public query in isolated test");
  }
});
const { publicContentRepository } = await import("@/lib/cms/public-content-adapter");
const { buildSitemapEntries } = await import("@/lib/seo/sitemap-entries");

/**
 * What the public side is allowed to hand out.
 *
 * These are the assertions that matter most in this repository: an
 * unpublished profile, a non-discoverable country or a draft article
 * reaching a public read is a data-exposure bug, not a cosmetic one.
 */

test("an unknown slug and an unpublished one are indistinguishable", () => {
  assert.equal(getPublishedProfile("definitely-not-a-person"), undefined);
  assert.equal(getPublishedProfile(""), undefined);
  assert.equal(getPublishedProfile("../admin"), undefined);
});

test("every profile reachable publicly is approved and published", () => {
  for (const slug of publishedProfileSlugs) {
    const profile = getPublishedProfile(slug);
    assert.ok(profile, `${slug} is advertised but does not resolve`);
    assert.equal(profile.approvedProfile, true);
    assert.equal(profile.publicationStatus, "published");
  }
});

test("no public profile claims a verification it has not been given", () => {
  for (const profile of publishedProfiles) {
    for (const credential of profile.credentials) {
      if (credential.publicDisplayStatus === "verified") {
        assert.ok(
          credential.reviewedAt,
          `${profile.slug} marks ${credential.designation} verified with no review record`,
        );
      }
    }
  }
});

test("the public content repository returns nothing while nothing is published", async () => {
  // The backend publication boundary is separate; this exercises the empty response mapping.
  const page = await publicContentRepository.listArticles();
  assert.deepEqual(page.items, []);
  assert.equal(page.hasMore, false);

  // A slug that exists in the CMS fixtures must still read as absent here.
  assert.equal(await publicContentRepository.getArticle("any-slug"), undefined);
  assert.equal(await publicContentRepository.getPage("any-slug"), undefined);
  assert.deepEqual(await publicContentRepository.listCategories(), []);
});

test("invalid country and service codes resolve to nothing", () => {
  for (const code of ["ZZ", "", "../x", "US-FED"]) assert.equal(getCountry(code), undefined);
  for (const slug of ["not-a-service", "", "../admin"]) assert.equal(getService(slug), undefined);
});

test("country lookup is case-insensitive, and the canonical form is uppercase", () => {
  // `/countries/us` is reachable on purpose; the page sets its canonical to
  // the uppercase form so the two spellings are not two indexable URLs.
  const upper = getCountry("US");
  assert.ok(upper);
  assert.equal(getCountry("us")?.code, "US");
  assert.equal(getCountry(" Us ")?.code, "US");
  assert.equal(upper.code, upper.code.toUpperCase());
});

test("a country being in the catalogue does not make it discoverable", () => {
  const nonDiscoverable = ["AU", "DE", "FR", "SG", "IN", "AE", "BR", "ZA", "JP", "NL"]
    .map(getCountry)
    .filter((entry) => entry !== undefined)
    .filter((entry) => !isDiscoverable(entry));

  for (const country of nonDiscoverable) {
    assert.ok(
      !discoverableCountryCodes.includes(country.code),
      `${country.code} is not discoverable but is listed as one`,
    );
  }
});

test("the sitemap lists only indexable URLs", async () => {
  const entries = await buildSitemapEntries();
  const paths = entries.map((entry) => new URL(entry.url).pathname);

  assert.ok(paths.includes("/"));
  assert.ok(paths.includes("/services"));

  // Everything carrying a noindex must be absent.
  const forbidden = [
    "/find-accountant",
    "/for-professionals",
    "/sign-in",
    "/countries",
    "/admin",
  ];
  for (const path of forbidden) {
    assert.ok(!paths.includes(path), `${path} is noindex but appears in the sitemap`);
  }

  // No professional profile, and no country page, may be listed.
  for (const path of paths) {
    assert.ok(!path.startsWith("/professionals/"), `${path} publishes a fixture profile`);
    assert.ok(!path.startsWith("/countries/"), `${path} publishes a fixture country`);
    assert.ok(!path.startsWith("/admin"), `${path} publishes a staff route`);
  }
});

test("every service URL in the sitemap resolves to a real service", async () => {
  const entries = await buildSitemapEntries();
  const serviceSlugs = entries
    .map((entry) => new URL(entry.url).pathname)
    .filter((path) => path.startsWith("/services/"))
    .map((path) => path.replace("/services/", ""));

  assert.deepEqual([...serviceSlugs].sort(), [...serviceCatalogSlugs].sort());
  for (const slug of serviceSlugs) assert.ok(getService(slug), `${slug} 404s`);
});

test("the sitemap invents no timestamps", async () => {
  for (const entry of await buildSitemapEntries()) {
    if (entry.lastModified !== undefined) {
      assert.ok(!Number.isNaN(Date.parse(entry.lastModified)), `${entry.url} has a bad date`);
    }
  }
});
