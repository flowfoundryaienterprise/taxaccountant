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
 * ## What the disclaimer used to be doing here
 * These four cards previously showed a rating, a review count, an hourly
 * rate and an availability line for four named individuals, none of it
 * backed by anything. Day 9 added a six-line boxed paragraph above the grid
 * explaining that the numbers below it were not real.
 *
 * That paragraph is gone, because the claim it was disclaiming is gone:
 * `featuredProfessionals` now maps the fixture rows through `toCardModel`,
 * the same projection the directory uses, and `DirectoryProfessional` has
 * no rating, price or availability field to render. The cards show what is
 * actually recorded — declared designation, city, authorised tax
 * jurisdictions, languages, consultation mode.
 *
 * One quiet line remains, because these are still development fixtures
 * rather than listings, and that fact is worth one sentence rather than a
 * boxed warning.
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(({ slug, card }, index) => (
            <Reveal key={slug} delayMs={index * 60}>
              <ProfessionalCard
                professional={card}
                profileHref={professionalHref(slug)}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
