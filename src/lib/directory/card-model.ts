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
    /*
     * The codes themselves, not their expanded names. On a card, three
     * short labels joined together ("Canada Federal Ontario US Federal")
     * read as one run-on phrase, and the reader cannot tell where one
     * jurisdiction ends and the next begins. `CA-FED · CA-ON · US-FED` is
     * unambiguous, and it is the vocabulary the filters and the URL
     * already use, so what the card shows is what the user types.
     *
     * The expanded names are kept on `jurisdictionsLabel` for the row's
     * tooltip, so nothing is lost for a reader who does not know a code.
     */
    jurisdictions: professional.jurisdictionCodes,
    jurisdictionsLabel: professional.jurisdictionCodes.map(jurisdictionShortLabel).join(", "),
    consultation: { remote: professional.remote, inPerson: professional.inPerson },
    photo: professional.photo,
    photoAlt:
      professional.photoAlt ??
      `${professional.displayName} has no profile photograph in this listing`,
  };
}
