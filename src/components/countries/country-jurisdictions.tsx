import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import type { JurisdictionOption } from "@/lib/directory/taxonomy";
import type { CountryEntry } from "@/lib/marketplace/countries";
import { directoryHref } from "@/lib/marketplace/query-params";

interface CountryJurisdictionsProps {
  country: CountryEntry;
  jurisdictions: JurisdictionOption[];
}

/**
 * Tax jurisdictions that exist for a country.
 *
 * The four concepts the brief requires be kept apart are spelled out in the
 * panel below rather than assumed: professional location, customer
 * location, tax jurisdiction and professional authorization. Each row links
 * into the directory with `?jurisdiction=` **only** — never combined with
 * `?country=` — because filtering by a jurisdiction must not quietly also
 * filter by where professionals are based. That is the whole point of
 * keeping the two axes separate (DATABASE.md: "country location and
 * authorization must remain distinct").
 */
export function CountryJurisdictions({ country, jurisdictions }: CountryJurisdictionsProps) {
  return (
    <section id="tax-jurisdictions" className="bg-tint/50 py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Tax jurisdictions"
          title={`Tax jurisdictions listed for ${country.name}`}
          description="These are the tax authorities the directory can filter on for this country. Listing one is not a statement that any particular professional is authorized for it."
        />

        {jurisdictions.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No tax jurisdictions are configured yet"
            description="Jurisdictions appear once they have been added to the taxonomy and marked active. Nothing is listed until then."
            actions={[
              { label: "Open the directory", href: directoryHref({ country: country.code }) },
            ]}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jurisdictions.map((jurisdiction) => (
              <li key={jurisdiction.value} className="flex">
                <Link
                  href={directoryHref({ jurisdiction: jurisdiction.value })}
                  className="group flex h-full w-full flex-col gap-2 rounded-card border border-border bg-white p-5 transition-colors duration-200 hover:border-action hover:shadow-[0_18px_32px_-26px_rgba(16,44,87,0.35)]"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="h-4 w-4 shrink-0 text-action" aria-hidden />
                    <span className="font-mono text-caption text-slate">
                      {jurisdiction.value}
                    </span>
                  </span>
                  <span className="text-compact font-semibold text-navy">{jurisdiction.label}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-caption font-medium text-action">
                    Professionals authorized here
                    <ArrowRight
                      className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-4 rounded-panel border border-border bg-white p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {[
            {
              term: "Professional location",
              detail: `Where a professional works from — for this page, ${country.name}.`,
            },
            {
              term: "Customer location",
              detail: "Where you are. Separate from where you are required to file.",
            },
            {
              term: "Tax jurisdiction",
              detail: "A tax authority whose rules apply to a filing or obligation.",
            },
            {
              term: "Professional authorization",
              detail:
                "Permission to act for a jurisdiction, granted there — never implied by location.",
            },
          ].map((item) => (
            <div key={item.term} className="flex flex-col gap-1.5">
              <p className="text-compact font-semibold text-navy">{item.term}</p>
              <p className="text-caption text-slate">{item.detail}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
