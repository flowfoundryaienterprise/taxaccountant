import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CountryBadge } from "@/components/countries/country-badge";
import { Container } from "@/components/layout/container";
import { MagneticCta } from "@/components/shared/magnetic-cta";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { mapMarkers } from "@/lib/home-content";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";

/**
 * Coverage, as a register of authorities rather than a decorated map.
 *
 * ## What this replaces
 * A checklist of five generic claims ("Professionals in 50+ countries",
 * "Local tax experts with global experience") beside a map carrying seven
 * markers, each with an infinite `animate-marker-pulse`, a 3px action-blue
 * glow ring, and a floating callout reading "2,500+ Experts". The counts
 * were invented, two of the seven markers were not countries this site has
 * a page for ("Europe", "Other Countries"), and the callouts were
 * positioned by a hand-tuned array of seven `translate()` strings that only
 * held at one viewport width.
 *
 * The map now does what a map is for — showing where — with eight quiet
 * markers and nothing written over it. What the section is actually about,
 * which authority you can file with in each country, is set beside it as a
 * list that can be read, with the jurisdiction codes in mono.
 *
 * Those codes are the signature of this product: `US-FED`, `GB-HMRC`,
 * `CA-ON`. They are the real filter vocabulary from
 * `@/lib/directory/taxonomy`, and no generic professional directory has
 * anything like them.
 */
const jurisdictionsByCountry = mapMarkers.map((marker) => ({
  ...marker,
  codes: jurisdictionOptions
    .filter((option) => option.countryCode === marker.code)
    .map((option) => option.value),
}));

export function GlobalCoverage() {
  return (
    <section id="coverage" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Coverage"
          title="Eight countries, twelve tax authorities"
          description="Filing authority, not office location. A professional may be authorised in several of these at once."
        />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col">
              {jurisdictionsByCountry.map((country, index) => (
                <Reveal key={country.code} delayMs={index * 40}>
                  <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-3 first:pt-0">
                    <span className="flex items-center gap-2.5 text-compact text-navy">
                      <CountryBadge code={country.code} countryName={country.name} size="sm" />
                      {country.name}
                    </span>
                    <span className="font-mono text-caption text-slate">
                      {country.codes.join(" · ")}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>

            {/* Day 4 brief section 8: "Explore by Country" opens the country
                directory, not a generic professional search. */}
            <MagneticCta strength={0.3} className="w-fit">
              <Link
                href="/countries"
                className="group inline-flex h-11 w-fit items-center gap-2 rounded-input bg-action px-5 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"
              >
                Explore by country
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </MagneticCta>
          </div>

          <div className="relative aspect-[2/1] w-full rounded-panel bg-tint">
            <Image
              src="/images/world-map.svg"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="rounded-panel object-contain"
            />

            {/*
              Decorative: every country and code on this map is listed in
              full beside it, so the markers carry no information of their
              own and are hidden from assistive technology rather than
              announced eight times. Static, not pulsing — a loop here would
              claim these points are live or changing, which they are not;
              see the note above on the marker pulse this map used to carry.
            */}
            {mapMarkers.map((marker) => (
              <span
                key={marker.code}
                aria-hidden
                className="absolute block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action ring-2 ring-white"
                style={{ left: `${marker.mapX}%`, top: `${marker.mapY}%` }}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
