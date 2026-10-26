import { directoryFixtures } from "@/lib/directory/fixtures";
import { jurisdictionOptions, type JurisdictionOption } from "@/lib/directory/taxonomy";
import { serviceCatalog, type ServiceCatalogEntry } from "@/lib/marketplace/services";

/**
 * Country catalogue for `/countries` and `/countries/[countryCode]`.
 *
 * ## Status: development fixtures, shaped like the real collection
 * There is no `countries:listDiscoverable` query yet (API.md section 2;
 * IMPLEMENTATION_PLAN.md day 12), so this module stands in for it. Every
 * field below is named after the Convex `countries` document it will be read
 * from (DATABASE.md section 2): `code`, `name`, `defaultLocale`,
 * `displayCurrency`, `discoverable`, `status`. Swapping in the query means
 * replacing `countryCatalog` with its result and deleting the fixtures — the
 * components consume `CountryEntry` either way.
 *
 * ## Truthfulness rules applied here
 *  - **No professional counts, coverage claims or "N experts" labels.** The
 *    brief forbids inventing country-specific professional numbers and the
 *    platform has no published professionals at all yet.
 *  - **Available services are derived, never asserted.** `servicesForCountry`
 *    reads the Day 3 development fixtures and reports only the categories
 *    actually present for that country, so a country page cannot advertise a
 *    service nobody in the dataset offers.
 *  - **Jurisdictions are listed separately from location.** The jurisdictions
 *    on a country page are the tax authorities that exist for that country —
 *    not a claim about who is authorized for them. Authorization is a
 *    per-professional fact and lives in the directory.
 *  - **Two countries are deliberately not discoverable** (`FR`, `JP`), so the
 *    unavailable state is a real, exercised path rather than dead code.
 *  - Country context text is plain geography-and-administration description.
 *    No rates, thresholds, deadlines or regulatory claims appear anywhere in
 *    this file; those require stakeholder review (DESIGN.md section 13).
 */

/** Mirrors `countries.status` in `convex/schema.ts`. */
export type CountryStatus = "draft" | "review" | "published" | "disabled";

export interface CountryEntry {
  /** ISO 3166-1 alpha-2, uppercase. Mirrors `countries.code`. */
  code: string;
  name: string;
  /** Short form used where the full name would wrap badly. */
  shortName?: string;
  defaultLocale: string;
  displayCurrency: string;
  /** Mirrors `countries.discoverable` — gates public listing and linking. */
  discoverable: boolean;
  /** Mirrors `countries.status`. */
  status: CountryStatus;
  /** Grouping label for the index page. Presentation only. */
  region: string;
  /** Neutral description of how tax administration is organised. */
  context: string;
  /**
   * Equirectangular percentage position on `public/images/world-map.svg`,
   * computed the same way as the homepage markers:
   * `x = (lon + 180) / 360 * 100`, `y = (90 - lat) / 180 * 100`.
   */
  mapX: number;
  mapY: number;
}

export const countryCatalog: CountryEntry[] = [
  {
    code: "US",
    name: "United States",
    shortName: "USA",
    defaultLocale: "en-US",
    displayCurrency: "USD",
    discoverable: true,
    status: "published",
    region: "North America",
    context:
      "Tax in the United States is administered at federal level and separately by individual states, so a filer can have obligations to more than one authority in the same year. The jurisdictions listed below are the ones this directory currently distinguishes between.",
    mapX: 22.6,
    mapY: 27.9,
  },
  {
    code: "CA",
    name: "Canada",
    defaultLocale: "en-CA",
    displayCurrency: "CAD",
    discoverable: true,
    status: "published",
    region: "North America",
    context:
      "Canada administers tax federally alongside provincial and territorial regimes. A professional's authorization is specific to the authorities they are registered with, which is listed separately from where they are based.",
    mapX: 20.5,
    mapY: 18.8,
  },
  {
    code: "GB",
    name: "United Kingdom",
    shortName: "UK",
    defaultLocale: "en-GB",
    displayCurrency: "GBP",
    discoverable: true,
    status: "published",
    region: "Europe",
    context:
      "Tax in the United Kingdom is administered centrally by HM Revenue & Customs. Devolved arrangements apply to some taxes; confirm the position for your own circumstances with an authorized professional.",
    mapX: 49.4,
    mapY: 20.0,
  },
  {
    code: "DE",
    name: "Germany",
    defaultLocale: "de-DE",
    displayCurrency: "EUR",
    discoverable: true,
    status: "published",
    region: "Europe",
    context:
      "Germany administers federal taxes centrally while assessment is handled through regional tax offices. Who may advise on German tax matters is a regulated question answered in Germany, not by this marketplace.",
    mapX: 52.9,
    mapY: 21.6,
  },
  {
    code: "IN",
    name: "India",
    defaultLocale: "en-IN",
    displayCurrency: "INR",
    discoverable: true,
    status: "published",
    region: "Asia Pacific",
    context:
      "India administers direct taxes and goods and services tax through separate regimes, and a business can have obligations under both. The directory treats them as distinct tax jurisdictions for that reason.",
    mapX: 71.9,
    mapY: 38.6,
  },
  {
    code: "SG",
    name: "Singapore",
    defaultLocale: "en-SG",
    displayCurrency: "SGD",
    discoverable: true,
    status: "published",
    region: "Asia Pacific",
    context:
      "Singapore administers tax centrally through a single national authority. It is frequently part of cross-border arrangements, so professionals here often work alongside counterparts in other jurisdictions.",
    mapX: 78.8,
    mapY: 49.3,
  },
  {
    code: "AU",
    name: "Australia",
    defaultLocale: "en-AU",
    displayCurrency: "AUD",
    discoverable: true,
    status: "published",
    region: "Asia Pacific",
    context:
      "Australia administers tax federally, with some obligations arising at state and territory level. Who may prepare and lodge returns is regulated nationally.",
    mapX: 87.2,
    mapY: 64.1,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    shortName: "UAE",
    defaultLocale: "en-AE",
    displayCurrency: "AED",
    discoverable: true,
    status: "published",
    region: "Middle East",
    context:
      "The United Arab Emirates administers federal taxes through a national authority, alongside free-zone arrangements that can affect an entity's position. Confirm the specifics for your entity with an authorized professional.",
    mapX: 65.0,
    mapY: 37.0,
  },

  // ---------------------------------------------------------------------
  // Not discoverable. Present so the unavailable state is a real path that
  // can be tested, and so a guessed URL returns an honest answer rather
  // than a fabricated country page. These never appear in any listing.
  // ---------------------------------------------------------------------
  {
    code: "FR",
    name: "France",
    defaultLocale: "fr-FR",
    displayCurrency: "EUR",
    discoverable: false,
    status: "review",
    region: "Europe",
    context:
      "France is not yet open for public discovery on TaxAccountant.com. Its jurisdiction and service configuration has not completed review.",
    mapX: 50.6,
    mapY: 21.4,
  },
  {
    code: "JP",
    name: "Japan",
    defaultLocale: "ja-JP",
    displayCurrency: "JPY",
    discoverable: false,
    status: "draft",
    region: "Asia Pacific",
    context:
      "Japan is not yet open for public discovery on TaxAccountant.com. Its jurisdiction and service configuration has not been set up.",
    mapX: 88.2,
    mapY: 29.9,
  },
];

const byCode = new Map(countryCatalog.map((country) => [country.code, country]));

/**
 * Resolves a route parameter to a country. Accepts any casing so
 * `/countries/us` works, but callers should link to the canonical uppercase
 * form (`countryHref`) and set the canonical URL to it.
 */
export function getCountry(code: string): CountryEntry | undefined {
  return byCode.get(code.trim().toUpperCase());
}

/** Exactly the countries that may be listed and linked publicly. */
export function isDiscoverable(country: CountryEntry): boolean {
  return country.discoverable && country.status === "published";
}

export const discoverableCountries: CountryEntry[] = countryCatalog
  .filter(isDiscoverable)
  .sort((a, b) => a.name.localeCompare(b.name));

export const discoverableCountryCodes = discoverableCountries.map((country) => country.code);

/** Region buckets in a stable display order, listing only what exists. */
export function countriesByRegion(countries: CountryEntry[]) {
  const order = ["North America", "Europe", "Middle East", "Asia Pacific"];
  const groups = new Map<string, CountryEntry[]>();

  for (const country of countries) {
    const bucket = groups.get(country.region);
    if (bucket) bucket.push(country);
    else groups.set(country.region, [country]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      return (indexA < 0 ? order.length : indexA) - (indexB < 0 ? order.length : indexB);
    })
    .map(([region, entries]) => ({ region, countries: entries }));
}

/**
 * Tax jurisdictions that exist for a country.
 *
 * This is a list of tax authorities, **not** a list of professionals
 * authorized for them, and not a claim that the country's professionals
 * cover all of them. The two concepts are kept apart everywhere in this
 * codebase (DATABASE.md: "country location and authorization must remain
 * distinct").
 */
export function jurisdictionsForCountry(code: string): JurisdictionOption[] {
  const upper = code.toUpperCase();
  return jurisdictionOptions.filter((option) => option.countryCode === upper);
}

/**
 * Service categories genuinely represented for a country in the current
 * dataset — derived from the Day 3 development fixtures, never asserted.
 * Returned in the catalogue's display order so every page orders them the
 * same way.
 */
export function servicesForCountry(code: string): ServiceCatalogEntry[] {
  const upper = code.toUpperCase();
  const present = new Set<string>();

  for (const professional of directoryFixtures) {
    if (professional.countryCode !== upper) continue;
    for (const slug of professional.serviceSlugs) present.add(slug);
  }

  return serviceCatalog.filter((service) => present.has(service.slug));
}

/**
 * How many development-preview example profiles sit under a country.
 *
 * Only ever rendered next to the "development preview" notice, and never as
 * a marketplace-coverage figure — there are no published professionals yet,
 * so presenting this as inventory would be a fabricated claim.
 */
export function exampleProfileCount(code: string): number {
  const upper = code.toUpperCase();
  return directoryFixtures.filter((professional) => professional.countryCode === upper).length;
}

/**
 * Approved country guides and resources. Intentionally empty: no
 * country-specific editorial content has been written or reviewed, and
 * `contentPages` holds no rows. The country page renders an honest empty
 * state from this rather than inventing links. Resources land with the CMS
 * (IMPLEMENTATION_PLAN.md day 16-17).
 */
export interface CountryResource {
  title: string;
  description: string;
  href: string;
}

export function resourcesForCountry(_code: string): CountryResource[] {
  return [];
}

/** Case-insensitive match on country name, short name or ISO code. */
export function matchesCountryQuery(country: CountryEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [country.name, country.shortName ?? "", country.code, country.region]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
