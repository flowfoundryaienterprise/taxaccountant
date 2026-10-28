import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { demoProfessionals } from "@/lib/home-content";
import { professionalHref } from "@/lib/marketplace/query-params";

export function FeaturedProfessionals() {
  return (
    <section id="professionals" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Trusted professionals"
            title="Top Tax Accountants Near You"
            description="Browse verified professionals based on your location, services, ratings, and availability."
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-semibold text-action"
          >
            View All Professionals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {demoProfessionals.map((professional, index) => (
            <Reveal key={professional.id} delayMs={index * 60}>
              {/*
                Passed field-by-field rather than spread: `ProfessionalCard`
                gained optional designation/jurisdiction/language rows for the
                Day 3 directory, and this Day 2 section must keep rendering
                exactly the fields it was approved with.
              */}
              <ProfessionalCard
                professional={{
                  id: professional.id,
                  name: professional.name,
                  city: professional.city,
                  countryName: professional.countryName,
                  services: professional.services,
                  rating: professional.rating,
                  reviewCount: professional.reviewCount,
                  rate: professional.rate,
                  availability: professional.availability,
                  photo: professional.photo,
                  photoAlt: professional.photoAlt,
                }}
                /* One canonical profile route, shared with the directory. */
                profileHref={professionalHref(professional.profileSlug)}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
