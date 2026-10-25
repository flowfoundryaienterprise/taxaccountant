import {
  citySlug,
  countryCodes,
  jurisdictionCodes,
  languageCodes,
  serviceSlugs,
} from "@/lib/directory/taxonomy";
import type {
  ConsultationMode,
  DirectoryFilters,
  DirectorySort,
} from "@/lib/directory/types";

/**
 * Single source of truth for directory URL state. The URL *is* the filter
 * store — no client state library, which keeps shareable links, refresh and
 * browser back/forward correct for free (DESIGN.md section 8: "Search should
 * not reset filters on back/forward, refresh or shareable URL loads").
 *
 * Param conventions are shared with the Day 2 homepage search so a link
 * built on either side means the same thing (brief section 9).
 */

export const DIRECTORY_PATH = "/find-accountant";

export const PAGE_SIZE = 9;

/** Bounded keyword length — API.md section 10: "reasonable query lengths". */
export const MAX_QUERY_LENGTH = 80;

const SORT_VALUES: DirectorySort[] = ["name-asc", "name-desc", "recent"];
const MODE_VALUES: ConsultationMode[] = ["either", "remote", "in_person"];

export const DEFAULT_SORT: DirectorySort = "name-asc";
export const DEFAULT_MODE: ConsultationMode = "either";

/** Shape handed to a page by both Next.js and vinext. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const EMPTY_FILTERS: DirectoryFilters = {
  q: "",
  countries: [],
  cities: [],
  jurisdictions: [],
  services: [],
  languages: [],
  mode: DEFAULT_MODE,
  sort: DEFAULT_SORT,
  page: 1,
};

/**
 * Accepts both repeated params (`?country=US&country=CA`) and the shorter
 * comma form this app emits (`?country=US,CA`). Unknown values are dropped
 * rather than erroring, so a hand-edited or stale URL degrades to a valid
 * search instead of a broken page.
 */
function readList(
  raw: RawSearchParams,
  key: string,
  isValid: (value: string) => boolean,
): string[] {
  const input = raw[key];
  if (input === undefined) return [];

  const parts = (Array.isArray(input) ? input : [input])
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  for (const part of parts) {
    if (isValid(part) && !seen.has(part)) seen.add(part);
  }
  return [...seen];
}

function readSingle(raw: RawSearchParams, key: string): string {
  const input = raw[key];
  const value = Array.isArray(input) ? input[0] : input;
  return value?.trim() ?? "";
}

export function parseDirectoryFilters(
  raw: RawSearchParams,
  /** City tokens present in the data, so an unknown city cannot stick. */
  knownCityTokens?: Set<string>,
): DirectoryFilters {
  const modeInput = readSingle(raw, "mode") as ConsultationMode;
  const sortInput = readSingle(raw, "sort") as DirectorySort;
  const pageInput = Number.parseInt(readSingle(raw, "page"), 10);

  return {
    q: readSingle(raw, "q").slice(0, MAX_QUERY_LENGTH),
    countries: readList(raw, "country", (value) => countryCodes.has(value)),
    cities: readList(raw, "city", (value) =>
      knownCityTokens ? knownCityTokens.has(value) : value === citySlug(value),
    ),
    jurisdictions: readList(raw, "jurisdiction", (value) => jurisdictionCodes.has(value)),
    services: readList(raw, "service", (value) => serviceSlugs.has(value)),
    languages: readList(raw, "language", (value) => languageCodes.has(value)),
    mode: MODE_VALUES.includes(modeInput) ? modeInput : DEFAULT_MODE,
    sort: SORT_VALUES.includes(sortInput) ? sortInput : DEFAULT_SORT,
    page: Number.isFinite(pageInput) && pageInput > 0 ? pageInput : 1,
  };
}

/**
 * Serializes only meaningful values: defaults and empty lists are omitted so
 * "Clear All" really does return to a bare `/find-accountant`, and no URL
 * carries `?mode=either&sort=name-asc&page=1` noise.
 */
export function toDirectorySearchParams(filters: DirectoryFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.countries.length) params.set("country", filters.countries.join(","));
  if (filters.cities.length) params.set("city", filters.cities.join(","));
  if (filters.jurisdictions.length) params.set("jurisdiction", filters.jurisdictions.join(","));
  if (filters.services.length) params.set("service", filters.services.join(","));
  if (filters.languages.length) params.set("language", filters.languages.join(","));
  if (filters.mode !== DEFAULT_MODE) params.set("mode", filters.mode);
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

/**
 * Builds a directory URL from a partial patch.
 *
 * Any change other than `page` itself resets pagination, because page 4 of a
 * previous result set is meaningless against new filters (brief section 8).
 */
export function buildDirectoryHref(
  base: DirectoryFilters,
  patch: Partial<DirectoryFilters> = {},
): string {
  const resetPage = Object.keys(patch).some((key) => key !== "page");
  const next: DirectoryFilters = {
    ...base,
    ...patch,
    page: patch.page ?? (resetPage ? 1 : base.page),
  };

  const params = toDirectorySearchParams(next);
  const query = params.toString();
  return query ? `${DIRECTORY_PATH}?${query}` : DIRECTORY_PATH;
}

/**
 * "Clear all filters" URL: empties every filter axis, including the keyword
 * (it appears in the chip row, so clearing all must clear it), while keeping
 * the chosen `sort` — a sort order is not a filter. One helper so the
 * sidebar, the chip row and the empty state cannot disagree.
 */
export function clearAllHref(filters: DirectoryFilters): string {
  return buildDirectoryHref(filters, {
    q: "",
    countries: [],
    cities: [],
    jurisdictions: [],
    services: [],
    languages: [],
    mode: DEFAULT_MODE,
  });
}

/** True when nothing is narrowing the result set. */
export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return Boolean(
    filters.q ||
      filters.countries.length ||
      filters.cities.length ||
      filters.jurisdictions.length ||
      filters.services.length ||
      filters.languages.length ||
      filters.mode !== DEFAULT_MODE,
  );
}

/**
 * Identity of the committed search, for the page to use as a React `key` on
 * the search bar: a URL change remounts it so its inputs re-seed from the
 * URL, with no setState-in-effect sync. Lives here rather than in the
 * `"use client"` component, because the Server Component calls it.
 */
export function searchBarKey(filters: DirectoryFilters): string {
  return [filters.q, filters.countries.join("+"), filters.services.join("+")].join("|");
}

/** Adds or removes one value from a multi-select filter list. */
export function toggleValue(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
}
