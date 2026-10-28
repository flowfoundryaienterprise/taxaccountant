import { directoryFixtures } from "@/lib/directory/fixtures";
import {
  countryLabel,
  jurisdictionLabel,
  jurisdictionShortLabel,
  languageLabel,
  serviceLabel,
} from "@/lib/directory/taxonomy";
import type { DirectoryProfessional } from "@/lib/directory/types";
import type {
  ProfessionalProfile,
  ProfileCredential,
  ProfileLocation,
} from "@/lib/professionals/profile-types";

/**
 * Display helpers for the professional profile page.
 *
 * Pure functions with no framework imports, so every section formats the
 * same fact the same way and the rules below live in one reviewable place
 * rather than being re-decided inside each component.
 */

/** Firm practices are addressed by their registered name where one exists. */
export function profileName(profile: ProfessionalProfile): string {
  return profile.firmName ?? profile.displayName;
}

/** Self-declared designations, joined. Never rendered with a verification mark. */
export function designationLine(profile: ProfessionalProfile): string | undefined {
  const designations = profile.credentials.map((credential) => credential.designation);
  return designations.length ? designations.join(", ") : undefined;
}

export function primaryLocation(profile: ProfessionalProfile): ProfileLocation | undefined {
  return profile.locations.find((location) => location.isPrimary) ?? profile.locations[0];
}

/** "New York, United States" — city plus the joined country name, never a street address. */
export function locationLine(location: ProfileLocation): string {
  return [location.city, countryLabel(location.countryCode)].filter(Boolean).join(", ");
}

/**
 * The same string with the administrative region, where one is held.
 *
 * A region that simply repeats the city is dropped — several city-states and
 * same-named states ("New York, New York") would otherwise read as a
 * mistake rather than as extra information.
 */
export function detailedLocationLine(location: ProfileLocation): string {
  const region = location.region === location.city ? undefined : location.region;
  return [location.city, region, countryLabel(location.countryCode)]
    .filter(Boolean)
    .join(", ");
}

/**
 * Consultation wording.
 *
 * `inPersonServices` is optional in the schema, so an unstated position is
 * reported as unstated — it is never inferred from the professional having a
 * practice location.
 */
export function consultationLabel(profile: ProfessionalProfile): string {
  if (profile.inPersonServices === undefined) {
    return profile.remoteServices
      ? "Remote consultations — in-person availability not stated"
      : "Consultation arrangements not stated";
  }

  if (profile.remoteServices && profile.inPersonServices) return "Remote or in person";
  if (profile.remoteServices) return "Remote only";
  if (profile.inPersonServices) return "In person only";
  return "Consultation arrangements not stated";
}

const CREDENTIAL_STATUS_LABELS: Record<ProfileCredential["publicDisplayStatus"], string> = {
  unverified: "Not yet verified by the marketplace",
  verified: "Verified by the marketplace",
  expired: "Previously verified — now expired",
};

export function credentialStatusLabel(credential: ProfileCredential): string {
  return CREDENTIAL_STATUS_LABELS[credential.publicDisplayStatus];
}

/**
 * Whether a credential may carry a verified badge.
 *
 * Two conditions, both required: the credential row says `verified` **and**
 * it carries the `reviewedAt` timestamp that only a completed documentary
 * review writes. A fixture or a stray field value alone can never produce a
 * badge (Day 5 brief section 8; DATABASE.md section 2: "production verified
 * requires documentary review record").
 */
export function isGenuinelyVerified(credential: ProfileCredential): boolean {
  return credential.publicDisplayStatus === "verified" && credential.reviewedAt !== undefined;
}

/** True when at least one credential has actually been reviewed and approved. */
export function hasVerifiedCredential(profile: ProfessionalProfile): boolean {
  return profile.credentials.some(isGenuinelyVerified);
}

/** Every distinct jurisdiction across this professional's enabled services. */
export function jurisdictionCodes(profile: ProfessionalProfile): string[] {
  const codes = new Set<string>();
  for (const service of profile.services) {
    for (const code of service.jurisdictionCodes) codes.add(code);
  }
  return [...codes];
}

/** Every distinct country the professional practises from. */
export function locationCountryCodes(profile: ProfessionalProfile): string[] {
  return [...new Set(profile.locations.map((location) => location.countryCode))];
}

export const jurisdictionLabels = (codes: string[]) => codes.map(jurisdictionLabel);
export const jurisdictionShortLabels = (codes: string[]) => codes.map(jurisdictionShortLabel);
export const languageLabels = (codes: string[]) => codes.map(languageLabel);
export const serviceLabels = (slugs: string[]) => slugs.map(serviceLabel);

/**
 * Meta description built only from facts on the record: name, designations,
 * primary location and the service categories actually attached.
 */
export function profileMetaDescription(profile: ProfessionalProfile): string {
  const location = primaryLocation(profile);
  const designation = designationLine(profile);
  const services = serviceLabels(profile.services.map((service) => service.serviceSlug));

  const who = [profileName(profile), designation].filter(Boolean).join(", ");
  const where = location ? ` based in ${locationLine(location)}` : "";
  const what = services.length
    ? ` Services listed: ${services.slice(0, 3).join(", ")}.`
    : "";

  return `${who}${where} on TaxAccountant.com.${what} Tax jurisdictions, languages and consultation preferences are listed separately on the profile.`;
}

/**
 * Related professionals, scored on genuine overlap with the profile being
 * viewed — shared service categories first, then shared tax jurisdictions,
 * then shared languages, then the same country.
 *
 * Rows come from the same Day 3 fixture set the directory serves, so nothing
 * can appear here that the directory would not show, and a profile with no
 * overlap returns an empty list rather than being padded out.
 */
export function relatedProfessionals(
  profile: ProfessionalProfile,
  limit = 3,
): DirectoryProfessional[] {
  const services = new Set(profile.services.map((service) => service.serviceSlug));
  const jurisdictions = new Set(jurisdictionCodes(profile));
  const languages = new Set(profile.languageCodes);
  const countries = new Set(locationCountryCodes(profile));

  const countShared = (values: string[], against: Set<string>) =>
    values.filter((value) => against.has(value)).length;

  return directoryFixtures
    .filter((candidate) => candidate.slug !== profile.slug)
    .map((candidate) => ({
      candidate,
      score:
        countShared(candidate.serviceSlugs, services) * 4 +
        countShared(candidate.jurisdictionCodes, jurisdictions) * 3 +
        countShared(candidate.languageCodes, languages) * 2 +
        (countries.has(candidate.countryCode) ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.displayName.localeCompare(b.candidate.displayName),
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/**
 * Profile FAQs.
 *
 * Every answer describes how this marketplace works, not the reader's tax
 * position: no rates, no deadlines, no thresholds, no advice. Written from
 * the profile itself so a profile with no contact channel cannot claim one.
 */
export function profileFaqs(profile: ProfessionalProfile) {
  const name = profileName(profile);
  const location = primaryLocation(profile);
  const where = location ? countryLabel(location.countryCode) : "the listed country";

  return [
    {
      question: `Is ${name} verified by TaxAccountant.com?`,
      answer:
        "No. The designations shown on this page are self-declared and are labelled as not yet verified. Credential review is a later phase of this platform, and no verified badge is applied to anyone until a documented review has been completed and approved.",
    },
    {
      question: `Does being listed in ${where} mean this professional can file my taxes there?`,
      answer:
        "Not on its own. The practice location describes where the professional works from. Whether they may act before a particular tax authority is a separate fact, shown in the tax jurisdictions section, and it is granted by that jurisdiction rather than by this marketplace. Confirm it directly before engaging anyone.",
    },
    {
      question: "Why are there no reviews, ratings or fees on this page?",
      answer:
        "Because none of that data exists. There is no review workflow, no completed engagement to review and no quoting or payment feature on the platform, so nothing of the sort is shown rather than being approximated.",
    },
    {
      question: "Can I book an appointment from this page?",
      answer:
        "No. Appointment booking and calendar availability are a later phase of this platform. Nothing on this page represents real-time availability, working hours or bookable time.",
    },
    {
      question: "How do I contact this professional?",
      answer:
        profile.publicContactMode === "none"
          ? "No contact channel has been enabled for this profile yet, so this page does not offer one. Rather than collect a message that could not be delivered, the contact section says so plainly."
          : "Use the contact option in the contact section of this page. It carries the context of this profile with it so the enquiry arrives attached to the right listing.",
    },
  ];
}
