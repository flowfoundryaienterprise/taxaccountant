import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import { ProfessionalPreview } from "@/components/shared/professional-preview";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceBenefits } from "@/components/services/service-benefits";
import { ServiceDetailHero } from "@/components/services/service-detail-hero";
import { ServiceFaq } from "@/components/services/service-faq";
import { ServiceGrid } from "@/components/services/service-grid";
import { ServiceNeeds } from "@/components/services/service-needs";
import { filterProfessionals } from "@/lib/directory/filters";
import { directoryFixtures } from "@/lib/directory/fixtures";
import { EMPTY_FILTERS } from "@/lib/directory/query-params";
import { directoryHref } from "@/lib/marketplace/query-params";
import {
  getService,
  relatedServices,
  serviceCatalogSlugs,
} from "@/lib/marketplace/services";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Only the eight approved service slugs are pre-rendered. Anything else
 * falls through to `notFound()` below rather than producing a thin page —
 * the brief's "avoid generating hundreds of thin or duplicate pages" rule
 * starts here.
 */
export function generateStaticParams() {
  return serviceCatalogSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    return {
      title: "Service not found",
      robots: { index: false, follow: true },
    };
  }

  const canonical = `/services/${service.slug}`;

  return {
    title: service.title,
    description: service.overview,
    alternates: { canonical },
    openGraph: {
      title: `${service.title} | TaxAccountant.com`,
      description: service.overview,
      url: canonical,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Reusable service detail template.
 *
 * Content comes from `@/lib/marketplace/services`; the professional preview
 * comes from the Day 3 development fixtures through the same
 * `filterProfessionals` function the directory uses, so this page can never
 * show a professional the directory would filter out. When
 * `services:getBySlug` and `professionals:search` exist (API.md section 2),
 * those two reads are what change — the sections do not.
 */
export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const matches = filterProfessionals(directoryFixtures, {
    ...EMPTY_FILTERS,
    services: [service.slug],
  });

  const findHref = directoryHref({ service: service.slug });
  const related = relatedServices(service.slug);

  return (
    <>
      <ServiceDetailHero service={service} />
      <ServiceBenefits service={service} />
      <ServiceNeeds service={service} />

      <section id="find-professionals" className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Find professionals"
            title={`Professionals offering ${service.title.toLowerCase()}`}
            description="Opening the directory from here keeps this service selected, so you can add a country, tax jurisdiction or language on top of it."
          />

          <ProfessionalPreview
            professionals={matches}
            directoryHref={findHref}
            directoryLabel={`See all ${service.title.toLowerCase()} professionals`}
            subject={service.title.toLowerCase()}
          />
        </Container>
      </section>

      <ServiceFaq
        items={service.faqs}
        title={`${service.title} — frequently asked questions`}
        description="General information about this category of work. Nothing here is advice about your own tax position."
        tone="tinted"
        structuredData
      />

      {related.length ? (
        <section className="py-16 sm:py-20">
          <Container className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Related" title="Other services to consider" />
              <Link
                href="/services"
                className="group inline-flex items-center gap-1.5 text-compact font-semibold text-action"
              >
                View all services
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <ServiceGrid services={related} columns={3} animate={false} />
          </Container>
        </section>
      ) : null}

      <MarketplaceCta
        title={`Find an accountant for ${service.title.toLowerCase()}`}
        description="This service stays selected in the directory, so you only need to add the country, tax jurisdiction or language that applies to you."
        primary={{ label: "Find an Accountant", href: findHref }}
        secondary={{ label: "Browse countries", href: "/countries" }}
        note="Confirm authorization for your tax jurisdiction, the scope of the work and the fee directly with any professional you contact."
      />
    </>
  );
}
