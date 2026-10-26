import { ProfessionalCard } from "@/components/shared/professional-card";
import { Reveal } from "@/components/shared/reveal";
import { toCardModel } from "@/lib/directory/card-model";
import type { DirectoryResults } from "@/lib/directory/types";

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
