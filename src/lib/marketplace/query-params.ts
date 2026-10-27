import {
  DIRECTORY_PATH,
  EMPTY_FILTERS,
  buildDirectoryHref,
} from "@/lib/directory/query-params";

/**
 * Cross-page links into the professional directory.
 *
 * Every service and country page builds its "find professionals" links
 * through here rather than hand-writing a query string, so the parameter
 * names can never drift from the Day 3 contract (`country`, `service`,
 * `jurisdiction`, comma-separated, defaults omitted — see
 * `@/lib/directory/query-params` and docs/DAY3_DIRECTORY.md section 1).
 *
 * `buildDirectoryHref` also validates nothing here: the directory page
 * re-parses and drops unknown values on arrival, so a stale slug degrades to
 * a valid search rather than a broken page.
 */

export interface DirectoryLinkOptions {
  /** ISO 3166-1 alpha-2, as used by `?country=`. */
  country?: string;
  /** Service slug, as used by `?service=`. */
  service?: string;
  /** Tax jurisdiction code, as used by `?jurisdiction=` — never derived from `country`. */
  jurisdiction?: string;
}

export function directoryHref(options: DirectoryLinkOptions = {}): string {
  const { country, service, jurisdiction } = options;

  if (!country && !service && !jurisdiction) return DIRECTORY_PATH;

  return buildDirectoryHref(EMPTY_FILTERS, {
    countries: country ? [country] : [],
    services: service ? [service] : [],
    jurisdictions: jurisdiction ? [jurisdiction] : [],
  });
}

export const SERVICES_PATH = "/services";
export const COUNTRIES_PATH = "/countries";

export const serviceHref = (slug: string) => `${SERVICES_PATH}/${slug}`;

/**
 * Country routes are canonically uppercase (`/countries/US`), matching the
 * `?country=US` directory param and the `countries.code` column. Lowercase
 * requests still resolve, but their canonical tag points here.
 */
export const countryHref = (code: string) => `${COUNTRIES_PATH}/${code.toUpperCase()}`;

export const PROFESSIONALS_PATH = "/professionals";

/**
 * The one canonical professional profile route. Every "View Profile" link —
 * directory, homepage highlights, service and country previews, related
 * professionals — is built here so no second profile URL shape can appear.
 *
 * `returnTo` is the directory's own query string (from
 * `toDirectorySearchParams`), carried so the profile's "Back to Search
 * Results" link can restore the filters the reader arrived with. It is never
 * trusted as a URL: the profile page re-parses it through
 * `parseDirectoryFilters` and rebuilds the link against `DIRECTORY_PATH`, so
 * a hand-edited value degrades to a plain directory link and can never
 * redirect off-site.
 */
export function professionalHref(slug: string, returnTo?: string): string {
  const path = `${PROFESSIONALS_PATH}/${slug}`;
  return returnTo ? `${path}?from=${encodeURIComponent(returnTo)}` : path;
}
