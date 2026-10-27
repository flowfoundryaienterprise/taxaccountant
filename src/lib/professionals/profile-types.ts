import type { CredentialDisplayStatus } from "@/lib/directory/types";

/**
 * Typed contract for the public professional profile view
 * (`/professionals/[slug]`).
 *
 * Field names mirror the Phase 1 Convex collections in `convex/schema.ts`
 * one-for-one, so the fixture implementation can be replaced by
 * `professionals:getPublishedBySlug` (API.md section 2) without reshaping a
 * single component:
 *
 *   slug/displayName/kind/firmName/bio/remoteServices  -> `professionals`
 *   approvedProfile/verificationStatus/publicationStatus -> `professionals`
 *   publicContactMode/featured/updatedAt               -> `professionals`
 *   locations                                          -> `professionalLocations` + `countries`
 *   services                                           -> `professionalServices` + `serviceCategories` + `taxJurisdictions`
 *   languageCodes                                      -> `professionalLanguages` + `languages`
 *   credentials                                        -> `professionalPublicCredentials`
 *
 * Deliberately absent, because no collection, approved source or query
 * behavior exists for them: ratings, review counts, fees, years of
 * experience, client counts, awards, previous employers, professional
 * memberships, working hours and appointment slots. A component cannot leak
 * a fabricated value it has no field for.
 */

/** Mirrors `professionals.verificationStatus`. */
export type ProfileVerificationStatus =
  | "not_reviewed"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

/** Mirrors `professionals.publicationStatus`. */
export type ProfilePublicationStatus =
  | "draft"
  | "review"
  | "published"
  | "suspended"
  | "archived";

/** Mirrors `professionals.publicContactMode`. */
export type PublicContactMode = "contact_form" | "external" | "none";

/** Mirrors one `professionalLocations` row joined to its `countries` row. */
export interface ProfileLocation {
  /** ISO 3166-1 alpha-2, from the joined `countries.code`. */
  countryCode: string;
  city: string;
  region?: string;
  /**
   * Approved public location wording. Never a private street address —
   * DATABASE.md section 2: "no private street address exposed unless
   * approved".
   */
  publicLocationText?: string;
  isPrimary: boolean;
}

/**
 * Mirrors one enabled `professionalServices` row, which is a
 * (service, tax jurisdiction) pair — not a service offered everywhere.
 *
 * `jurisdictionCodes` collapses the rows for one service, so the UI can
 * render "Business Tax Services — Canada Federal, Ontario, US Federal" from
 * three sibling rows.
 */
export interface ProfileService {
  serviceSlug: string;
  jurisdictionCodes: string[];
  /** `professionalServices.description`, only when the curator supplied one. */
  description?: string;
  remote: boolean;
}

/** Mirrors one `professionalPublicCredentials` row. */
export interface ProfileCredential {
  designation: string;
  /** `issuer` — rendered only when supplied; never inferred from the designation. */
  issuer?: string;
  /** `jurisdictionId` resolved to its code; a credential may be jurisdiction-less. */
  jurisdictionCode?: string;
  publicDisplayStatus: CredentialDisplayStatus;
  /** `reviewedAt` — present only when a documented review actually happened. */
  reviewedAt?: number;
}

export interface ProfessionalProfile {
  slug: string;
  displayName: string;
  kind: "individual" | "firm";
  firmName?: string;
  /**
   * `professionals.bio`, split into paragraphs for rendering. Empty when no
   * biography has been supplied and approved — the About section then shows
   * an honest empty state rather than generated filler.
   */
  bio: string[];
  /** `approvedProfile` — public display gate, independent of credentials. */
  approvedProfile: boolean;
  /** Credential review outcome for the professional as a whole. */
  verificationStatus: ProfileVerificationStatus;
  publicationStatus: ProfilePublicationStatus;
  /** `professionals.remoteServices`. */
  remoteServices: boolean;
  /**
   * Whether in-person consultations are offered. Optional because
   * `professionals.inPersonServices` is optional in the schema: a profile
   * that has never stated a position shows "not stated", never a guess
   * derived from having a location.
   */
  inPersonServices?: boolean;
  publicContactMode: PublicContactMode;
  featured: boolean;
  locations: ProfileLocation[];
  services: ProfileService[];
  languageCodes: string[];
  credentials: ProfileCredential[];
  /** Rights-cleared portrait, when one exists for this profile. */
  photo?: string;
  photoAlt?: string;
  /**
   * `professionals.updatedAt`. Absent on fixtures: an invented "last
   * updated" date would be a fabricated fact, so no date is rendered.
   */
  updatedAt?: number;
}
