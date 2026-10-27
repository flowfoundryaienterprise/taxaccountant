import { directoryFixtures } from "@/lib/directory/fixtures";
import type { DirectoryProfessional } from "@/lib/directory/types";
import type {
  ProfessionalProfile,
  ProfileLocation,
  ProfileService,
} from "@/lib/professionals/profile-types";

/**
 * DEVELOPMENT-ONLY PROFILE FIXTURES — not listings.
 *
 * No `convex/professionals` module exists yet:
 * `professionals:getPublishedBySlug` (API.md section 2) is scheduled for
 * IMPLEMENTATION_PLAN.md Day 10 and the Day 5 brief forbids implementing
 * backend services here. So `/professionals/[slug]` is built and tested
 * against this typed set, shaped exactly like the eventual query projection
 * (`@/lib/professionals/profile-types`).
 *
 * ## Derived from the Day 3 directory, never written twice
 * Every published profile is *built from* its `directoryFixtures` row
 * (`@/lib/directory/fixtures`). Identity, city, country, service list,
 * jurisdiction list, languages, consultation modes and the portrait all come
 * from there, so a profile page can never show a professional the directory
 * would filter out, or disagree with the card the reader clicked.
 *
 * The per-slug `ProfileExtras` below add only what a profile page needs and
 * a directory card does not: a biography, additional practice locations, and
 * the per-service jurisdiction mapping that `professionalServices` actually
 * stores.
 *
 * ## Integrity rules applied to every row
 *  - **No fabricated credentials.** Every credential carries
 *    `publicDisplayStatus: "unverified"` and every professional carries
 *    `verificationStatus: "not_reviewed"`, because no documentary review has
 *    taken place. No issuer is supplied, because inventing one would invent
 *    a certification.
 *  - **No fabricated experience.** The biographies below describe the kind
 *    of work a profile covers and nothing else: no years of experience, no
 *    client counts, no awards, no previous employers, no professional
 *    memberships. Most rows have no biography at all, which is the honest
 *    state and the one the empty-state path renders.
 *  - **No fabricated coverage.** A service is only ever attached to
 *    jurisdictions the directory row already states for that professional.
 *  - **No contact channel is simulated.** Every row is
 *    `publicContactMode: "none"`, because no Phase 1 contact workflow exists
 *    yet (`contact:submit` plus a contact route, API.md section 3). The
 *    profile renders an honest availability message instead of a button that
 *    cannot do anything.
 *  - **No dates.** `updatedAt` is omitted rather than filled with a
 *    plausible-looking timestamp.
 */

interface ProfileExtras {
  /**
   * Paragraphs for `professionals.bio`. Omitted on most rows on purpose —
   * see the integrity rules above.
   */
  bio?: string[];
  /** Practice locations beyond the primary city held by the directory row. */
  additionalLocations?: Omit<ProfileLocation, "isPrimary">[];
  /** Approved public wording for the primary location, when there is any. */
  primaryLocationText?: string;
  primaryRegion?: string;
  /**
   * Per-service tax jurisdictions, i.e. the real `professionalServices`
   * (service, jurisdiction) pairs. A service left out here defaults to every
   * jurisdiction the professional states — which is exactly how the Day 3
   * directory already matches service and jurisdiction, so the default
   * asserts nothing new.
   *
   * Values are validated at build time against the directory row below: an
   * unknown service slug or a jurisdiction the professional does not claim
   * is dropped rather than displayed.
   */
  serviceJurisdictions?: Record<string, string[]>;
  /** Short curator note per service, where one has been written. */
  serviceDescriptions?: Record<string, string>;
}

const extrasBySlug: Record<string, ProfileExtras> = {
  "sarah-johnson": {
    bio: [
      "Sarah Johnson works with individuals and owner-managed businesses on United States federal and New York State filings, covering annual preparation as well as forward-looking planning conversations.",
      "Work usually starts by establishing which returns are actually due and what records exist to support them, before any figures are prepared. Clients who hold income in more than one state, or who changed circumstances during the year, are the most common reason that first step takes time.",
    ],
    primaryRegion: "New York",
    serviceJurisdictions: {
      "individual-tax-preparation": ["US-FED", "US-NY"],
      "business-tax-services": ["US-FED", "US-NY"],
      "tax-planning-advisory": ["US-FED"],
    },
    serviceDescriptions: {
      "tax-planning-advisory":
        "Planning discussions are held for the federal position only; state planning is handled with the return rather than separately.",
    },
  },
  "michael-chen": {
    bio: [
      "Michael Chen supports small and mid-sized businesses with Canadian federal and Ontario filing obligations, alongside the bookkeeping and payroll work those filings depend on.",
      "He is also authorized for United States federal filings, which is a separate authorization from the Canadian one and is listed separately on this page. Business owners with activity on both sides of the border are the usual reason both appear together.",
    ],
    primaryRegion: "Ontario",
    serviceJurisdictions: {
      "business-tax-services": ["CA-FED", "CA-ON", "US-FED"],
      // Ledger and payroll work is Canadian only — the US authorization
      // covers federal filings, not Ontario-style payroll administration.
      "bookkeeping-accounting": ["CA-FED", "CA-ON"],
      "payroll-services": ["CA-FED", "CA-ON"],
    },
  },
  "emily-rodriguez": {
    bio: [
      "Emily Rodriguez advises individuals with cross-border positions, principally United Kingdom self-assessment alongside United States federal obligations for people connected to both systems.",
      "Most engagements begin with establishing where a filing obligation exists before anything is prepared, because the answer frequently differs from where someone currently lives.",
    ],
    additionalLocations: [
      { countryCode: "US", city: "Boston", region: "Massachusetts" },
    ],
    serviceJurisdictions: {
      "individual-tax-preparation": ["GB-HMRC", "US-FED"],
      "international-tax-services": ["GB-HMRC", "US-FED"],
      "tax-planning-advisory": ["GB-HMRC"],
    },
  },
  "david-wilson": {
    primaryRegion: "New South Wales",
    serviceJurisdictions: {
      "business-tax-services": ["AU-ATO"],
      "bookkeeping-accounting": ["AU-ATO"],
      "tax-planning-advisory": ["AU-ATO"],
    },
  },
  "priya-raman": {
    bio: [
      "Priya Raman works with individuals and businesses on Indian income tax and GST obligations, including corrections to returns that have already been submitted.",
      "Engagements are usually taken on where the underlying records need review before a return can be prepared or amended, rather than where a filing is simply being transcribed.",
    ],
    primaryRegion: "Karnataka",
    serviceJurisdictions: {
      "individual-tax-preparation": ["IN-CBDT"],
      "business-tax-services": ["IN-CBDT", "IN-GST"],
      "amended-tax-returns": ["IN-CBDT", "IN-GST"],
    },
  },
  "northgate-tax-partners": {
    bio: [
      "Northgate Tax Partners LLP is a firm practice covering United States federal and California business filings, payroll administration and support through tax authority audits.",
      "Work is taken on at firm level, so the individual accountant assigned to an engagement is agreed at the start rather than selected from this listing.",
    ],
    primaryRegion: "California",
    additionalLocations: [
      { countryCode: "US", city: "Sacramento", region: "California" },
    ],
    serviceJurisdictions: {
      "business-tax-services": ["US-FED", "US-CA"],
      "payroll-services": ["US-FED", "US-CA"],
      "irs-tax-audit-support": ["US-FED", "US-CA"],
    },
    serviceDescriptions: {
      "irs-tax-audit-support":
        "Representation and document preparation during an open examination, for the jurisdictions listed here only.",
    },
  },
  "amara-okafor": {
    serviceJurisdictions: {
      "bookkeeping-accounting": ["GB-HMRC"],
      "payroll-services": ["GB-HMRC"],
    },
  },
  "lukas-weber": {
    bio: [
      "Lukas Weber works on German tax matters alongside United States federal filings for people connected to both systems, principally where income or residence has moved between the two.",
    ],
    serviceJurisdictions: {
      "international-tax-services": ["DE-BZST", "US-FED"],
      "individual-tax-preparation": ["DE-BZST", "US-FED"],
    },
  },
  "wei-lin-tan": {
    serviceJurisdictions: {
      "international-tax-services": ["SG-IRAS", "GB-HMRC"],
      "business-tax-services": ["SG-IRAS"],
      "tax-planning-advisory": ["SG-IRAS"],
    },
  },
  "fatima-al-mansoori": {
    bio: [
      "Fatima Al Mansoori works with businesses on United Arab Emirates filing obligations and the ledger work behind them, and separately on Indian income tax matters for clients with interests in both places.",
    ],
    additionalLocations: [{ countryCode: "AE", city: "Sharjah" }],
    serviceJurisdictions: {
      "business-tax-services": ["AE-FTA"],
      "international-tax-services": ["AE-FTA", "IN-CBDT"],
      "bookkeeping-accounting": ["AE-FTA"],
    },
  },
  "marco-silva": {
    primaryRegion: "Texas",
    serviceJurisdictions: {
      "irs-tax-audit-support": ["US-FED"],
      "amended-tax-returns": ["US-FED"],
      "individual-tax-preparation": ["US-FED"],
    },
  },
  "claire-dubois": {
    primaryRegion: "British Columbia",
    serviceJurisdictions: {
      "individual-tax-preparation": ["CA-FED"],
      "tax-planning-advisory": ["CA-FED"],
      "amended-tax-returns": ["CA-FED"],
    },
  },
  "harbourline-advisory": {
    bio: [
      "Harbourline Advisory Pty Ltd is a firm practice working with businesses on Australian filing obligations and payroll, and separately on Singapore matters for clients operating in both markets.",
    ],
    primaryRegion: "Victoria",
    additionalLocations: [{ countryCode: "SG", city: "Singapore" }],
    serviceJurisdictions: {
      "business-tax-services": ["AU-ATO", "SG-IRAS"],
      "payroll-services": ["AU-ATO"],
      "international-tax-services": ["AU-ATO", "SG-IRAS"],
    },
  },
  "rahul-mehta": {
    primaryRegion: "Maharashtra",
    serviceJurisdictions: {
      "bookkeeping-accounting": ["IN-GST"],
      "business-tax-services": ["IN-GST"],
      "payroll-services": ["IN-GST"],
    },
  },
  "anna-hoffmann": {
    primaryRegion: "Bavaria",
    serviceJurisdictions: {
      "individual-tax-preparation": ["DE-BZST"],
      "bookkeeping-accounting": ["DE-BZST"],
    },
  },
  "yousef-haddad": {
    serviceJurisdictions: {
      "business-tax-services": ["AE-FTA"],
      "tax-planning-advisory": ["AE-FTA"],
    },
  },
};

/**
 * Builds the `professionalServices` projection for one professional.
 *
 * The service list always equals the directory row's, so the two views
 * cannot disagree about what is offered. Only the jurisdiction mapping is
 * refined per service, and every mapped code is checked against the
 * professional's own jurisdictions — an extras entry can narrow coverage but
 * never widen it.
 */
function buildServices(
  row: DirectoryProfessional,
  extras: ProfileExtras,
): ProfileService[] {
  const claimed = new Set(row.jurisdictionCodes);

  return row.serviceSlugs.map((serviceSlug) => {
    const mapped = extras.serviceJurisdictions?.[serviceSlug]?.filter((code) =>
      claimed.has(code),
    );

    return {
      serviceSlug,
      jurisdictionCodes: mapped?.length ? mapped : row.jurisdictionCodes,
      description: extras.serviceDescriptions?.[serviceSlug],
      remote: row.remote,
    };
  });
}

function buildLocations(row: DirectoryProfessional, extras: ProfileExtras): ProfileLocation[] {
  return [
    {
      countryCode: row.countryCode,
      city: row.city,
      region: extras.primaryRegion,
      publicLocationText: extras.primaryLocationText,
      isPrimary: true,
    },
    ...(extras.additionalLocations ?? []).map((location) => ({
      ...location,
      isPrimary: false,
    })),
  ];
}

function buildProfile(row: DirectoryProfessional): ProfessionalProfile {
  const extras = extrasBySlug[row.slug] ?? {};

  return {
    slug: row.slug,
    displayName: row.displayName,
    kind: row.kind,
    firmName: row.firmName,
    bio: extras.bio ?? [],
    // Published fixtures stand for a curated profile whose *content* was
    // approved for publication. That is a separate fact from credential
    // verification, which has not happened for anyone (see below).
    approvedProfile: true,
    verificationStatus: "not_reviewed",
    publicationStatus: "published",
    remoteServices: row.remote,
    inPersonServices: row.inPerson,
    publicContactMode: "none",
    featured: false,
    locations: buildLocations(row, extras),
    services: buildServices(row, extras),
    languageCodes: row.languageCodes,
    credentials: row.credentials.map((credential) => ({
      designation: credential.designation,
      // No issuer and no `reviewedAt`: neither has been supplied or
      // reviewed, and neither may be invented.
      publicDisplayStatus: credential.status,
    })),
    photo: row.photo,
    photoAlt: row.photoAlt,
  };
}

/**
 * Every published, approved profile. Exported so the CMS can compose its own
 * wider view (published + unpublished) without the public module having to
 * carry unapproved rows — see `@/lib/admin/admin-unpublished-fixtures`.
 */
export const publishedProfiles: ProfessionalProfile[] = directoryFixtures.map(buildProfile);

/**
 * Public lookup index.
 *
 * Built from published rows **only**, deliberately.
 *
 * Day 5 briefly held the draft and suspended fixtures in this same map so
 * that the publication gate below did the rejecting. That was the wrong
 * trade: it put unapproved records into the deployed worker bundle, which
 * the project forbids outright, and a production build was measured
 * carrying them. Unapproved data must not be in a public module at all —
 * the strongest version of "unpublished profiles are inaccessible" is that
 * the public side never holds them.
 *
 * The gate in `getPublishedProfile` is unchanged and still runs on every
 * lookup: it is what will reject a draft or suspended row once
 * `professionals:getPublishedBySlug` returns real records, and it must also
 * be enforced server-side in that query. The unpublished fixtures now live
 * in `@/lib/admin/admin-unpublished-fixtures`, which only the CMS imports
 * and which is stripped from production builds.
 */
const bySlug = new Map(publishedProfiles.map((profile) => [profile.slug, profile]));

/**
 * The public read. Mirrors `professionals:getPublishedBySlug`: an
 * unapproved, draft, review, suspended or archived profile returns
 * `undefined` exactly like an unknown slug, so the page answers both with
 * the same not-found response and neither confirms the record exists.
 */
export function getPublishedProfile(slug: string): ProfessionalProfile | undefined {
  const profile = bySlug.get(slug);
  if (!profile) return undefined;
  if (!profile.approvedProfile) return undefined;
  if (profile.publicationStatus !== "published") return undefined;
  return profile;
}

/** Slugs safe to pre-render. Unpublished fixtures are never included. */
export const publishedProfileSlugs: string[] = publishedProfiles.map((profile) => profile.slug);

/** Count for the development-preview notice. Never presented as inventory. */
export const publishedProfileCount = publishedProfiles.length;
