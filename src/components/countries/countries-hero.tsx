import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

export interface CountryMarker {
  code: string;
  name: string;
  mapX: number;
  mapY: number;
}

/**
 * Countries index hero.
 *
 * The map markers are the countries actually open for discovery — nothing
 * else is plotted, and no marker carries a professional count or an
 * "experts" label. The map is the same public-domain Wikimedia asset the
 * homepage uses (public/images/ATTRIBUTIONS.md), recoloured to the brand
 * tokens; marker positions are plain equirectangular projection maths.
 */
export function CountriesHero({ markers }: { markers: CountryMarker[] }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-tint/50">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-14 left-[3%] select-none text-[11rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[15rem]"
      >
        {markers.length}
      </span>

      <Container className="relative flex flex-col gap-8 py-12 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Countries" }]} />

        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-[14ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
                {markers.length} countries, searchable today
              </h1>
              <p className="max-w-[62ch] text-lead text-slate">
                Explore tax and accounting professionals by country and find expertise for the
                jurisdictions that matter to you.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={directoryHref()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group transition-transform duration-150",
                )}
              >
                Find an Accountant
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/services"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Browse services
              </Link>
            </div>

            <p className="max-w-[66ch] rounded-card border border-border bg-white px-4 py-3 text-caption text-slate">
              A country appears here once it is open for public discovery. Being listed describes
              the jurisdictions and service categories configured for that country — it is not a
              statement that any particular professional is authorized there.
            </p>
          </Reveal>

          <Reveal
            delayMs={120}
            className="relative aspect-[2/1] w-full rounded-panel bg-white p-2 shadow-float"
          >
            <div className="relative h-full w-full">
              <Image
                src="/images/world-map.svg"
                alt={`World map marking the ${markers.length} countries currently open for discovery on TaxAccountant.com`}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain"
              />

              {markers.map((marker) => (
                /* Still exactly one static marker per open country, no
                   pulse — a ring beating forever under eight dots would
                   read as activity the site does not have. The marker is
                   the marker. */
                <span
                  key={marker.code}
                  className="absolute block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action ring-2 ring-white"
                  style={{ left: `${marker.mapX}%`, top: `${marker.mapY}%` }}
                  aria-hidden
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
