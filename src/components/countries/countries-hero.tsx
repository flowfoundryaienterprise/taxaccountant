import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
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
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Countries" }]} />

        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-[18ch] text-hero font-semibold text-navy">
                Find Tax Accountants Around the World
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
                  "group transition-transform duration-150 hover:-translate-y-0.5",
                )}
              >
                Find an Accountant
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
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
          </div>

          <div className="relative aspect-[2/1] w-full rounded-panel bg-white p-2 shadow-[0_28px_60px_-44px_rgba(16,44,87,0.5)]">
            <div className="relative h-full w-full">
              <Image
                src="/images/world-map.svg"
                alt={`World map marking the ${markers.length} countries currently open for discovery on TaxAccountant.com`}
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-contain"
              />

              {markers.map((marker, index) => (
                <span
                  key={marker.code}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${marker.mapX}%`, top: `${marker.mapY}%` }}
                  aria-hidden
                >
                  <span
                    className="animate-marker-pulse absolute inset-0 rounded-full bg-action"
                    style={{ animationDelay: `${index * 0.25}s` }}
                  />
                  <span className="relative block h-2.5 w-2.5 rounded-full border-2 border-white bg-action shadow-[0_0_0_3px_rgba(7,110,212,0.25)]" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
