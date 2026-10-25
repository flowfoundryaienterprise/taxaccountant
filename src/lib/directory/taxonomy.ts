import { searchCountries, services } from "@/lib/home-content";

import type { ConsultationMode, DirectorySort } from "@/lib/directory/types";

/**
 * Directory filter vocabularies.
 *
 * Countries and services are re-exported from the Day 2 homepage content so
 * the homepage search and the directory can never drift apart on param
 * values (brief section 9: "Homepage and directory use the same parameter
 * conventions"). Jurisdictions and languages are clearly identified Phase 1
 * development fixtures — the real lists come from `countries`,
 * `taxJurisdictions` and `languages` in Convex via `jurisdictions:listByCountry`
 * and friends (API.md section 2).
 */

export interface Option {
  value: string;
  label: string;
}

export const countryOptions: Option[] = searchCountries.map((country) => ({
  value: country.code,
  label: country.name,
}));

export const serviceOptions: Option[] = services.map((service) => ({
  value: service.slug,
  label: service.title,
}));

export interface JurisdictionOption extends Option {
  /** Context label only. Filtering by jurisdiction never filters by country. */
  countryCode: string;
  /** Compact form for professional cards, where space is tight. */
  short: string;
}

export const jurisdictionOptions: JurisdictionOption[] = [
  { value: "US-FED", label: "United States — Federal (IRS)", short: "US Federal", countryCode: "US" },
  { value: "US-CA", label: "California (FTB)", short: "California", countryCode: "US" },
  { value: "US-NY", label: "New York State (DTF)", short: "New York State", countryCode: "US" },
  { value: "CA-FED", label: "Canada — Federal (CRA)", short: "Canada Federal", countryCode: "CA" },
  { value: "CA-ON", label: "Ontario", short: "Ontario", countryCode: "CA" },
  { value: "GB-HMRC", label: "United Kingdom (HMRC)", short: "UK (HMRC)", countryCode: "GB" },
  { value: "IN-CBDT", label: "India — Income Tax (CBDT)", short: "India Income Tax", countryCode: "IN" },
  { value: "IN-GST", label: "India — GST", short: "India GST", countryCode: "IN" },
  { value: "AU-ATO", label: "Australia (ATO)", short: "Australia (ATO)", countryCode: "AU" },
  { value: "DE-BZST", label: "Germany (BZSt)", short: "Germany (BZSt)", countryCode: "DE" },
  { value: "SG-IRAS", label: "Singapore (IRAS)", short: "Singapore (IRAS)", countryCode: "SG" },
  { value: "AE-FTA", label: "United Arab Emirates (FTA)", short: "UAE (FTA)", countryCode: "AE" },
];

export const languageOptions: Option[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "zh", label: "Mandarin Chinese" },
  { value: "ar", label: "Arabic" },
];

export const consultationModeOptions: { value: ConsultationMode; label: string }[] = [
  { value: "either", label: "Either" },
  { value: "remote", label: "Remote" },
  { value: "in_person", label: "In person" },
];

export const sortOptions: { value: DirectorySort; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "recent", label: "Recently added" },
];

/**
 * Designation vocabulary for the credential filter. The control is built but
 * stays disabled: `professionalPublicCredentials.publicDisplayStatus` is
 * `unverified` for every fixture, and offering a designation filter would
 * imply the platform has reviewed them (DESIGN.md section 11).
 */
export const credentialOptions: Option[] = [
  { value: "cpa", label: "CPA" },
  { value: "ea", label: "Enrolled Agent" },
  { value: "ca", label: "Chartered Accountant" },
  { value: "acca", label: "ACCA" },
  { value: "cta", label: "Chartered Tax Adviser" },
];

const labelIndex = (options: Option[]) =>
  new Map(options.map((option) => [option.value, option.label]));

const countryLabels = labelIndex(countryOptions);
const serviceLabels = labelIndex(serviceOptions);
const jurisdictionLabels = labelIndex(jurisdictionOptions);
const languageLabels = labelIndex(languageOptions);

export const countryLabel = (code: string) => countryLabels.get(code) ?? code;
export const serviceLabel = (slug: string) => serviceLabels.get(slug) ?? slug;
export const jurisdictionLabel = (code: string) => jurisdictionLabels.get(code) ?? code;

const jurisdictionShortLabels = new Map(
  jurisdictionOptions.map((option) => [option.value, option.short]),
);

export const jurisdictionShortLabel = (code: string) =>
  jurisdictionShortLabels.get(code) ?? code;
export const languageLabel = (code: string) => languageLabels.get(code) ?? code;

/** URL-safe city token, e.g. "New York" -> "new-york". */
export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const countryCodes = new Set(countryOptions.map((option) => option.value));
export const serviceSlugs = new Set(serviceOptions.map((option) => option.value));
export const jurisdictionCodes = new Set(jurisdictionOptions.map((option) => option.value));
export const languageCodes = new Set(languageOptions.map((option) => option.value));
