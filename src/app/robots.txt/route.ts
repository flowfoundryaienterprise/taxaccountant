import { DIRECTORY_QUERY_PARAMS } from "@/lib/seo/indexing";
import { absoluteUrl, SITE_INDEXABLE } from "@/lib/seo/site";

/**
 * `/robots.txt`
 *
 * Served as a Route Handler for the same reason as the sitemap: vinext does
 * not register `app/robots.ts` (measured Day 8 — it returned the 404 page).
 *
 * ## What this does and does not do
 * Robots rules are a request to well-behaved crawlers. They are **not** an
 * access control, and nothing here is relied on for privacy:
 *
 *  - the CMS requires an authorized staff session on every deployment;
 *  - draft content is excluded by the public data layer, which never
 *    returns it, rather than by being hidden from crawlers.
 *
 * The disallow entries are about crawl budget, not secrecy — and listing a
 * genuinely secret path here would advertise it.
 *
 * Preview deployments disallow crawling. The approved production origin
 * uses targeted exclusions and each page's indexing decision.
 */
export function GET() {
  if (!SITE_INDEXABLE) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  /*
   * Faceted-search parameter forms. Disallowing the query shapes stops a
   * crawler enumerating filter permutations; the route's static canonical
   * handles any URL already discovered. Shareable filtered links are
   * unaffected for human visitors.
   */
  const filteredSearch = DIRECTORY_QUERY_PARAMS.map(
    (param) => `Disallow: /find-accountant?*${param}=`,
  );

  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Staff interface. Access also requires an authorized session.",
    "Disallow: /admin",
    "Disallow: /admin/",
    "",
    "# Authentication surface and internal probes: nothing for a searcher.",
    "Disallow: /sign-in",
    "Disallow: /api/",
    "",
    "# Faceted search: avoid enumerating filter permutations.",
    ...filteredSearch,
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
