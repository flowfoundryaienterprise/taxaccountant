import { ProfessionalCard } from "@/components/shared/professional-card";
import { Reveal } from "@/components/shared/reveal";
import { toCardModel } from "@/lib/directory/card-model";
import type { DirectoryResults } from "@/lib/directory/types";
import { professionalHref } from "@/lib/marketplace/query-params";

interface ProfessionalResultsProps {
  results: DirectoryResults;
  /**
   * The committed search, serialized. Carried into each profile link so the
   * profile's "Back to Search Results" returns to *this* result set with its
   * filters intact, rather than to a bare directory.
   */
  returnTo?: string;
}

export function ProfessionalResults({ results, returnTo }: ProfessionalResultsProps) {
  return (
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {results.items.map((professional, index) => (
        <li key={professional.slug} className="flex">
          <Reveal delayMs={Math.min(index, 5) * 50} className="flex w-full">
            <ProfessionalCard
              professional={toCardModel(professional)}
              profileHref={professionalHref(professional.slug, returnTo)}
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
