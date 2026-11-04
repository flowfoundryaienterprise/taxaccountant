import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { featuredSlugs } from "@/lib/home-content";
import { toCardModel } from "@/lib/directory/card-model";
import { directoryFixtures } from "@/lib/directory/fixtures";
import { professionalHref } from "@/lib/marketplace/query-params";

/**
 * Six example records, rendered through the directory's own projection, in
 * a static 3-up grid matching the approved mockup ("Meet the professionals").
 * `ProfessionalCard` itself is untouched.
 */
const featured = featuredSlugs.map((slug) => {
  const row = directoryFixtures.find((fixture) => fixture.slug === slug);
  if (!row) {
    throw new Error(`Homepage highlight references unknown fixture slug: ${slug}`);
  }
  return { slug, card: toCardModel(row) };
});

export function FeaturedProfessionals() {
  return (
    <section id="professionals" className="bg-tint py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Meet the professionals"
            title="Accountants & tax specialists."
            description="Preview the profile format. USA professional listings are coming soon."
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
          >
            View all professionals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(process.env.NODE_ENV === "production" ? [] : featured).map(({ slug, card }) => (
            <div key={slug}>
              <ProfessionalCard
                compact
                professional={card}
                profileHref={professionalHref(slug)}
                className="h-full"
                sizes="(min-width: 1024px) 33vw, 50vw"
              />
            </div>
          ))}
        </div>

        {process.env.NODE_ENV === "production" ? <p className="rounded-card border border-border bg-white p-8 text-slate">Approved USA professional listings will appear here when available.</p> : <p className="text-caption text-slate">
          Illustrative profiles for design preview, not active marketplace listings. No example profile has been verified
          yet, and each record states its own review status.
        </p>}
      </Container>
    </section>
  );
}
