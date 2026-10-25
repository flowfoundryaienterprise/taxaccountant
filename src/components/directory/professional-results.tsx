import { ProfessionalCard } from "@/components/shared/professional-card";
import { Reveal } from "@/components/shared/reveal";
import {
  countryLabel,
  jurisdictionShortLabel,
  languageLabel,
  serviceLabel,
} from "@/lib/directory/taxonomy";
import type { DirectoryProfessional, DirectoryResults } from "@/lib/directory/types";

/**
 * Maps the directory projection onto the shared card model.
 *
 * Note what is *not* mapped: rating, reviewCount, rate and availability. The
 * source type has no such fields, so the card renders none of them.
 */
function toCardModel(professional: DirectoryProfessional) {
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

export function ProfessionalResults({ results }: { results: DirectoryResults }) {
  return (
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {results.items.map((professional, index) => (
        <li key={professional.slug} className="flex">
          <Reveal delayMs={Math.min(index, 5) * 50} className="flex w-full">
            <ProfessionalCard
              professional={toCardModel(professional)}
              /* `/professionals/[slug]` is not built yet, so the card must
                 not pretend to link anywhere. */
              cta="pending"
              /* Favorites are a Phase 2 collection. */
              saveable={false}
              className="h-full w-full"
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 100vw"
            />
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
