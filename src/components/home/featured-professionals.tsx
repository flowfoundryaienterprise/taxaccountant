import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";

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
          {/*
            The previous description read "Browse verified professionals
            based on your location, services, ratings, and availability."
            Every claim in it was false: no profile has been verified
            (`verificationStatus` is `not_reviewed` for all of them), and the
            directory offers no rating or availability filter at all — see the
            note in `@/components/directory/filter-panel`, which states that
            those attributes have no approved data source. It now describes
            what the directory actually does.
          */}
          <SectionHeading
            eyebrow="Trusted professionals"
            title="Top Tax Accountants Near You"
            description="Browse professionals by location, service and tax jurisdiction."
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-semibold text-action"
          >
            View All Professionals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {/*
          Day 9: these four cards show a rating, a review count, an hourly
          rate and an availability line for four *named individuals*, and not
          one of those values is backed by anything — they came in with the
          Day 2 reference-template replica. `/find-accountant` says of the
          very same four records that "No ratings, reviews, prices or
          availability are shown, because none of that data exists yet", and
          `/professionals/sarah-johnson` reports her credentials as "Not yet
          verified by the marketplace". The homepage is the one indexable
          page of the three (sitemap priority 1.0), so it was the one page
          stating it as fact under a real brand.

          Removing the fields is a content decision against an explicitly
          approved reference design, so this does not do that. It labels
          them, in the same pattern the directory already uses, so the page
          no longer asserts them as real. Removing them outright is tracked
          as an open item in docs/DAY9_QA_REPORT.md for product sign-off.
        */}
        <p className="flex max-w-[80ch] gap-2 rounded-card border border-border bg-tint/50 px-4 py-3 text-caption text-slate">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
          <span>
            <strong className="font-semibold text-navy">
              Example profiles — demonstration data.
            </strong>{" "}
            These four cards are development examples used to build the homepage, not live
            listings. The ratings, review counts, rates and availability shown on them are
            placeholder values from the design reference: no professional has been verified, and
            no rating, review or availability data exists on this platform yet.{" "}
            <Link href="/find-accountant" className="font-medium text-action underline">
              The directory
            </Link>{" "}
            shows what is actually recorded for these profiles.
          </span>
        </p>

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
