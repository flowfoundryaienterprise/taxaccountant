import { UsersRound } from "lucide-react";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { toCardModel } from "@/lib/directory/card-model";
import type { DirectoryProfessional } from "@/lib/directory/types";
import { professionalHref } from "@/lib/marketplace/query-params";

interface RelatedProfessionalsProps {
  professionals: DirectoryProfessional[];
  /** Directory query string to carry through, so the back link survives a hop. */
  returnTo?: string;
}

/**
 * "Explore similar tax professionals".
 *
 * Reuses the Day 3 `ProfessionalCard` through the same `toCardModel`
 * projection the directory uses, so these cards cannot show a field the
 * directory would not. Rows are matched on genuine overlap — shared service
 * categories, tax jurisdictions, languages and country (see
 * `relatedProfessionals`) — and a profile with no overlap gets the honest
 * empty state rather than three unrelated profiles used as filler.
 */
export function RelatedProfessionals({
  professionals,
  returnTo,
}: RelatedProfessionalsProps) {
  return (
    <section id="related" className="bg-tint/50 py-16 sm:py-20">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Related"
          title="Explore similar tax professionals"
          description="Matched on shared service categories, tax jurisdictions, languages and location — not on any ranking, rating or paid placement, none of which exist on this platform."
        />

        {professionals.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No comparable profiles to show yet"
            description="Nothing in the current dataset overlaps enough with this profile to be a useful comparison, so nothing is shown. The directory is the place to widen the search."
            actions={[
              { label: "Open the full directory", href: "/find-accountant" },
              { label: "Browse all services", href: "/services", variant: "outline" },
            ]}
          />
        ) : (
          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <li key={professional.slug} className="flex">
                <ProfessionalCard
                  professional={toCardModel(professional)}
                  profileHref={professionalHref(professional.slug, returnTo)}
                  saveable={false}
                  className="h-full w-full"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
              </li>
            ))}
          </ol>
        )}
      </Container>
    </section>
  );
}
