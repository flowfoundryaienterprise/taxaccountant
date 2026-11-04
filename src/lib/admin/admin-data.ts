import { directoryFixtures } from "@/lib/directory/fixtures";
import {
  countryOptions,
  jurisdictionOptions,
  languageLabel,
  serviceLabel,
} from "@/lib/directory/taxonomy";
import { countryCatalog } from "@/lib/marketplace/countries";
import { serviceCatalog } from "@/lib/marketplace/services";
import { unpublishedProfileFixtures } from "@/lib/admin/admin-unpublished-fixtures";
import { publishedProfiles } from "@/lib/professionals/profile-fixtures";
import type {
  AdminCountryRow,
  AdminJurisdictionRow,
  AdminProfessionalRow,
  AdminServiceRow,
} from "@/lib/admin/admin-types";

/**
 * Adapters from the modules the **public site already renders** into the
 * CMS row shapes.
 *
 * This is the important distinction on every Day 6 screen. Services,
 * countries, jurisdictions and professional listings are not re-invented
 * here: they are projections of `serviceCatalog`, `countryCatalog`,
 * `jurisdictionOptions` and the professional fixtures, so the CMS shows
 * exactly what the live site shows and cannot drift from it. Those rows are
 * marked `provenance: "approved"`.
 *
 * Pages, articles and media have no source anywhere in the project — no
 * `contentPages` or `mediaAssets` row exists and none has been authored —
 * so those screens use clearly-labelled demonstration fixtures instead
 * (`admin-fixtures.ts`, `provenance: "demonstration"`).
 *
 * None of this is a Convex read. Every screen is a UI preview until the
 * authorized staff queries in docs/DAY6_ADMIN_CMS.md exist.
 */

const countryNames = new Map(countryOptions.map((option) => [option.value, option.label]));

/** Service categories, exactly as `/services` renders them. */
export function adminServices(): AdminServiceRow[] {
  return serviceCatalog.map((service, index) => ({
    id: service.slug,
    name: service.title,
    slug: service.slug,
    summary: service.description,
    // `home-content.ts` holds the imported Lucide component; its display
    // name is the closest thing to the `iconRef` a CMS record would store.
    iconRef: service.icon.displayName ?? service.icon.name ?? "unknown",
    featuredImagePath: service.image.src,
    sortOrder: index + 1,
    // Every catalogue entry is live on the public site today.
    status: "published",
    seo: {
      title: service.title,
      description: service.overview,
      canonicalPath: `/services/${service.slug}`,
    },
    provenance: "approved",
  }));
}

/**
 * Languages genuinely represented for a country, derived from the listings
 * rather than asserted — the same rule `servicesForCountry` follows, so the
 * CMS cannot advertise language coverage nobody offers.
 */
function languagesForCountry(code: string): string[] {
  const present = new Set<string>();
  for (const professional of directoryFixtures) {
    if (professional.countryCode !== code) continue;
    for (const language of professional.languageCodes) present.add(language);
  }
  return [...present];
}

function servicesForCountryCode(code: string): string[] {
  const present = new Set<string>();
  for (const professional of directoryFixtures) {
    if (professional.countryCode !== code) continue;
    for (const slug of professional.serviceSlugs) present.add(slug);
  }
  return [...present];
}

/**
 * Country records.
 *
 * The three activation flags are carried through separately and are never
 * collapsed into one "active" column. `countries` in DATABASE.md models
 * `discoverable`, `onboardingEnabled`, `transactionEnabled` and
 * `paymentEnabled` as independent facts, and the brief (section 8) requires
 * that country presence never imply marketplace authorization.
 *
 * `countryCatalog` carries no activation flags of its own — it is a public
 * discovery fixture — so every operational flag is reported as `false`,
 * which is the truth: no country has been activated for onboarding,
 * transactions or payments anywhere in this project.
 */
export function adminCountries(): AdminCountryRow[] {
  return countryCatalog.map((country) => ({
    id: country.code,
    name: country.name,
    code: country.code,
    discoverable: country.discoverable,
    status: country.status === "disabled" ? "archived" : country.status,
    onboardingEnabled: false,
    transactionEnabled: false,
    paymentEnabled: false,
    defaultLocale: country.defaultLocale,
    displayCurrency: country.displayCurrency,
    serviceSlugs: servicesForCountryCode(country.code),
    languageCodes: languagesForCountry(country.code),
    jurisdictionCodes: jurisdictionOptions
      .filter((option) => option.countryCode === country.code)
      .map((option) => option.value),
    seo: {
      title: `Tax Accountants in ${country.name}`,
      canonicalPath: `/countries/${country.code}`,
    },
    provenance: "approved",
  }));
}

/**
 * Tax jurisdictions.
 *
 * `level` is reported only where the approved taxonomy already states it
 * structurally: a national revenue authority code, or a jurisdiction that is
 * the sole entry for its country. Everything else is reported as `other`
 * rather than guessed. No regulatory classification, licence rule or
 * cross-border service right is invented (brief section 9).
 */
export function adminJurisdictions(): AdminJurisdictionRow[] {
  const perCountry = new Map<string, number>();
  for (const option of jurisdictionOptions) {
    perCountry.set(option.countryCode, (perCountry.get(option.countryCode) ?? 0) + 1);
  }

  return jurisdictionOptions.map((option) => {
    const isOnlyOne = perCountry.get(option.countryCode) === 1;
    const nationalAuthority = /-(FED|HMRC|ATO|IRAS|FTA|BZST|CBDT)$/.test(option.value);

    const serviceSlugs = new Set<string>();
    for (const professional of directoryFixtures) {
      if (!professional.jurisdictionCodes.includes(option.value)) continue;
      for (const slug of professional.serviceSlugs) serviceSlugs.add(slug);
    }

    return {
      id: option.value,
      code: option.value,
      label: option.label,
      countryCode: option.countryCode,
      level: nationalAuthority || isOnlyOne ? "national" : "other",
      // Every jurisdiction in the approved taxonomy backs a live directory
      // filter today.
      active: true,
      serviceSlugs: [...serviceSlugs],
      provenance: "approved",
    } satisfies AdminJurisdictionRow;
  });
}

/**
 * Professional listing records, including unpublished ones.
 *
 * `credentialsReviewed` is computed the same way the public profile decides
 * whether to show a badge: a credential must be `verified` **and** carry the
 * `reviewedAt` timestamp only a completed documentary review writes. No row
 * can report itself as reviewed on the strength of an enum alone.
 */
export function adminProfessionals(): AdminProfessionalRow[] {
  return [...publishedProfiles, ...unpublishedProfileFixtures].map((profile) => {
    const primary =
      profile.locations.find((location) => location.isPrimary) ?? profile.locations[0];

    const jurisdictions = new Set<string>();
    for (const service of profile.services) {
      for (const code of service.jurisdictionCodes) jurisdictions.add(code);
    }

    return {
      id: profile.slug,
      slug: profile.slug,
      displayName: profile.displayName,
      firmName: profile.firmName,
      designation: profile.credentials[0]?.designation,
      countryCode: primary?.countryCode ?? "",
      city: primary?.city ?? "",
      serviceSlugs: profile.services.map((service) => service.serviceSlug),
      jurisdictionCodes: [...jurisdictions],
      languageCodes: profile.languageCodes,
      status: profile.publicationStatus,
      verificationStatus: profile.verificationStatus,
      credentialsReviewed: profile.credentials.some(
        (credential) =>
          credential.publicDisplayStatus === "verified" && credential.reviewedAt !== undefined,
      ),
      provenance: "approved",
    } satisfies AdminProfessionalRow;
  });
}

export const countryName = (code: string) => countryNames.get(code) ?? code;
export const serviceName = serviceLabel;
export const languageName = languageLabel;

const jurisdictionLabels = new Map(
  jurisdictionOptions.map((option) => [option.value, option.label]),
);
export const jurisdictionName = (code: string) => jurisdictionLabels.get(code) ?? code;
