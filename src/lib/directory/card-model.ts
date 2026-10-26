import {
  countryLabel,
  jurisdictionShortLabel,
  languageLabel,
  serviceLabel,
} from "@/lib/directory/taxonomy";
import type { DirectoryProfessional } from "@/lib/directory/types";
import type { ProfessionalCardModel } from "@/components/shared/professional-card";

/**
 * Maps the directory projection onto the shared card model.
 *
 * Note what is *not* mapped: rating, reviewCount, rate and availability. The
 * source type has no such fields, so the card renders none of them.
 *
 * Extracted from `professional-results.tsx` on Day 4 so the service and
 * country pages render professionals through exactly the same projection as
 * the directory, instead of a second, drifting copy.
 */
export function toCardModel(professional: DirectoryProfessional): ProfessionalCardModel {
  const designations = professional.credentials.map((credential) => credential.designation);

  return {
    id: professional.slug,
    name: professional.firmName ?? professional.displayName,
    designation: designations.length ? designations.join(", ") : undefined,
    city: professional.city,
    countryName: countryLabel(professional.countryCode),
    services: professional.serviceSlugs.map(serviceLabel),
    languages: professional.languageCodes.map(languageLabel),
    jurisdictions: professional.jurisdictionCodes.map(jurisdictionShortLabel),
    consultation: { remote: professional.remote, inPerson: professional.inPerson },
    photo: professional.photo,
    photoAlt:
      professional.photoAlt ??
      `${professional.displayName} has no profile photograph in this listing`,
  };
}
