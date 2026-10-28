import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { mapMarkers } from "@/lib/home-content";

const coverageChecklist = [
  "Professionals in 50+ countries",
  "Local tax experts with global experience",
  "Multiple languages and currencies",
  "Support for individuals and businesses",
  "Compliance with local regulations",
];

export function GlobalCoverage() {
  return (
    <section id="coverage" className="py-16 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Global coverage"
            title="Find Tax Accountants in Your Country"
            description="We connect you with qualified tax and accounting professionals worldwide."
          />
          <ul className="flex flex-col gap-2.5">
            {coverageChecklist.map((item) => (
              <li key={item} className="flex items-center gap-2 text-compact text-slate">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-action" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {/* Day 4 brief section 8: "Explore by Country" opens the country
              directory, not a generic professional search. */}
          <Link
            href="/countries"
            className={
              "group inline-flex h-11 w-fit items-center gap-1.5 rounded-input bg-action px-5 text-compact font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0668c7] active:translate-y-0 active:scale-[0.98]"
            }
          >
            Explore by Country
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        <div className="relative aspect-[2/1] w-full overflow-visible rounded-panel bg-tint">
          <Image
            src="/images/world-map.svg"
            alt="World map highlighting the regions covered in TaxAccountant.com's directory"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="rounded-panel object-contain"
          />

          {mapMarkers.map((marker, index) => (
            <span
              key={marker.code}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marker.mapX}%`, top: `${marker.mapY}%` }}
              aria-hidden
            >
              <span
                className="animate-marker-pulse absolute inset-0 rounded-full bg-action"
                style={{ animationDelay: `${index * 0.3}s` }}
              />
              <span className="relative block h-2.5 w-2.5 rounded-full border-2 border-white bg-action shadow-[0_0_0_3px_rgba(7,110,212,0.25)]" />
            </span>
          ))}

          {mapMarkers.map((marker, index) => {
            const positions = [
              "translate(6%, -135%)",
              "translate(-108%, -115%)",
              "translate(-15%, -140%)",
              "translate(6%, -45%)",
              "translate(6%, -45%)",
              "translate(-15%, 25%)",
              "translate(-15%, 25%)",
            ];
            return (
              <div
                key={marker.code}
                className="absolute hidden rounded-card border border-border bg-white px-3 py-1.5 shadow-[0_16px_32px_-20px_rgba(16,44,87,0.35)] sm:block"
                style={{
                  left: `${marker.mapX}%`,
                  top: `${marker.mapY}%`,
                  transform: positions[index],
                }}
              >
                <p className="text-caption font-semibold text-navy">{marker.name}</p>
                <p className="text-caption text-action">{marker.expertsLabel}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
