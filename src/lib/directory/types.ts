/**
 * Typed contract for the public directory view. Field names deliberately
 * mirror the Phase 1 Convex collections in `convex/schema.ts` so the fixture
 * implementation can be swapped for `professionals:search` (API.md section 2)
 * without reshaping the UI:
 *
 *   slug/displayName/kind/firmName/remote -> `professionals`
 *   designations                          -> `professionalPublicCredentials`
 *   city/countryCode                      -> `professionalLocations` + `countries`
 *   jurisdictionCodes/serviceSlugs        -> `professionalServices`
 *   languageCodes                         -> `professionalLanguages` + `languages`
 *
 * Deliberately absent: rating, reviewCount, price and availability. Those
 * attributes have no collection, no approved source and no query behavior
 * yet (API.md section 2: "Filters for ratings, availability and price return
 * no false data; release them only once those attributes exist").
 */

export type ConsultationMode = "remote" | "in_person" | "either";

export type DirectorySort = "name-asc" | "name-desc" | "recent";

/** Mirrors `professionalPublicCredentials.publicDisplayStatus`. */
export type CredentialDisplayStatus = "unverified" | "verified" | "expired";

export interface DirectoryCredential {
  designation: string;
  status: CredentialDisplayStatus;
}

export interface DirectoryProfessional {
  slug: string;
  displayName: string;
  kind: "individual" | "firm";
  firmName?: string;
  /**
   * Self-declared designations only. Every fixture carries status
   * "unverified" because no documentary review record exists (DATABASE.md
   * Phase 1 invariants: a verified badge requires reviewed evidence).
   */
  credentials: DirectoryCredential[];
  city: string;
  countryCode: string;
  /**
   * Authorized tax jurisdictions, intentionally independent of
   * `countryCode` — a physical location never implies authorization
   * elsewhere (DATABASE.md: "country location and authorization must remain
   * distinct").
   */
  jurisdictionCodes: string[];
  serviceSlugs: string[];
  languageCodes: string[];
  remote: boolean;
  inPerson: boolean;
  /** Optional: only fixtures with a rights-cleared portrait carry one. */
  photo?: string;
  photoAlt?: string;
  /**
   * Fixture insertion order standing in for Convex `_creationTime`. Not a
   * real publication date, so no date is ever rendered from it.
   */
  fixtureOrder: number;
}

export interface DirectoryFilters {
  q: string;
  countries: string[];
  cities: string[];
  jurisdictions: string[];
  services: string[];
  languages: string[];
  mode: ConsultationMode;
  sort: DirectorySort;
  page: number;
}

export interface DirectoryResults {
  items: DirectoryProfessional[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/** A single removable chip in the active-filter row. */
export interface ActiveFilterChip {
  key: keyof DirectoryFilters;
  value: string;
  label: string;
  groupLabel: string;
}
