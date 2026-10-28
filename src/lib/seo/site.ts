/**
 * Canonical origin and site identity.
 *
 * ## Why this module exists
 * `https://taxaccountant.com` was hard-coded in four separate files
 * (`app/layout.tsx`, `shared/breadcrumbs.tsx`, `admin/seo-fields.tsx`,
 * `admin/admin-fixtures.ts`). Four copies of a value that appears in every
 * canonical tag and every sitemap URL is four chances to drift, and a
 * canonical pointing at the wrong host is one of the few SEO mistakes that
 * actively removes a site from search results.
 *
 * ## The host is an assumption, not a confirmed fact
 * The Day 8 brief is explicit: "Implement canonical URLs only after
 * confirming the canonical host. Do not invent a deployment URL." No
 * approved document in `documents/` states a production domain —
 * ARCHITECTURE.md section 5 says only "custom domain and HTTPS" without
 * naming one. `taxaccountant.com` matches the project name and was set on
 * Day 1, so it is carried forward as the default rather than replaced by a
 * second guess.
 *
 * It is now overridable by `NEXT_PUBLIC_SITE_ORIGIN`, so deploying to the
 * real host (or to a staging host that must not claim production
 * canonicals) is a configuration change rather than a code edit across four
 * files. **Confirm the production host before launch** — this is recorded
 * as an open item in docs/DAY8_SEO_PERFORMANCE.md.
 */

const FALLBACK_ORIGIN = "https://taxaccountant.com";

function normalizeOrigin(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return FALLBACK_ORIGIN;

  try {
    // Reject anything that is not an absolute http(s) URL rather than
    // emitting a malformed canonical.
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return FALLBACK_ORIGIN;
    // Trailing slashes would double up when joined with a path.
    return url.origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

/**
 * The absolute origin every canonical, Open Graph URL and sitemap entry is
 * built from. `NEXT_PUBLIC_*` because the breadcrumb JSON-LD that uses it
 * is rendered in components that may run on the client.
 */
export const SITE_ORIGIN = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_ORIGIN);

/** True when the origin is still the unconfirmed Day 1 default. */
export const SITE_ORIGIN_IS_DEFAULT = SITE_ORIGIN === FALLBACK_ORIGIN;

export const SITE_NAME = "TaxAccountant.com";

export const SITE_DESCRIPTION =
  "TaxAccountant.com connects customers with qualified tax and accounting professionals worldwide.";

/**
 * Joins a site-relative path onto the origin.
 *
 * Normalizes to exactly one leading slash and strips a trailing slash from
 * everything except the root, so `/services/` and `/services` cannot both
 * appear as canonicals for the same page — duplicate trailing-slash
 * variants are one of the duplicate-content cases the brief calls out.
 */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_ORIGIN}/`;

  const withLeading = path.startsWith("/") ? path : `/${path}`;
  // Keep any query string intact; only the path segment is normalized.
  const [pathname, query] = withLeading.split("?");
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  return `${SITE_ORIGIN}${trimmed}${query ? `?${query}` : ""}`;
}
