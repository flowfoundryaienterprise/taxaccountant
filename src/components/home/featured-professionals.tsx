import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { featuredSlugs } from "@/lib/home-content";
import { toCardModel } from "@/lib/directory/card-model";
import { directoryFixtures } from "@/lib/directory/fixtures";
import { professionalHref } from "@/lib/marketplace/query-params";

/**
 * Four example records, rendered through the directory's own projection.
 *
 * Redesign note: the flat 4-up grid became a horizontal scroll-snap rail —
 * an asymmetric alternative to the generic equal-card row design-taste-
 * frontend-v1 flags, and it reads naturally on mobile without a breakpoint
 * collapsing a grid. `ProfessionalCard` itself is untouched.
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
    <section id="professionals" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Example records"
            title="What a professional record holds"
            description="Declared credentials, the jurisdictions they are authorised in, languages and consultation mode — the fields the directory filters on."
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
          >
            Open the directory
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <p className="text-caption text-slate">
          Development examples, not live listings. No profile on this platform has been verified
          yet, and each record states its own review status.
        </p>

        <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {featured.map(({ slug, card }, index) => (
            <Reveal
              key={slug}
              delayMs={index * 60}
              className="w-[78vw] max-w-80 shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <ProfessionalCard
                professional={card}
                profileHref={professionalHref(slug)}
                className="h-full"
                sizes="(min-width: 1024px) 25vw, 78vw"
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
