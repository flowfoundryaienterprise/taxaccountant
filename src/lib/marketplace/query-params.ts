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
