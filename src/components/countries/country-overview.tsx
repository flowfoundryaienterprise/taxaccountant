import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coins, Globe2, Languages } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { CountryBadge } from "@/components/countries/country-badge";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import type { CountryEntry } from "@/lib/marketplace/countries";
import { directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

/**
 * Country detail header.
 *
 * The map graphic is the shared public-domain world map with a single
 * marker for this country — an illustrative locator, not a claim about
 * coverage inside its borders. `defaultLocale` and `displayCurrency` are
 * shown because they are real configuration on the country record
 * (`countries` in DATABASE.md section 2) and describe how this site will
 * present the country, not anything about tax.
 */
export function CountryOverview({ country }: { country: CountryEntry }) {
  return (
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-12 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Countries", href: "/countries" },
            { label: country.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <Reveal className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <CountryBadge code={country.code} countryName={country.name} size="lg" />
              <span className="rounded-full border border-border bg-white px-3 py-1 text-caption font-semibold text-navy">
                {country.region}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
                Tax &amp; accounting professionals in {country.name}
              </h1>
              <p className="max-w-[64ch] text-lead text-slate">{country.context}</p>
            </div>

            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-action" aria-hidden />
                <dt className="sr-only">Country code</dt>
                <dd className="text-compact text-slate">ISO code {country.code}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-action" aria-hidden />
                <dt className="sr-only">Default locale</dt>
                <dd className="text-compact text-slate">Default locale {country.defaultLocale}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-action" aria-hidden />
                <dt className="sr-only">Display currency</dt>
                <dd className="text-compact text-slate">
                  Display currency {country.displayCurrency}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={directoryHref({ country: country.code })}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group h-auto max-w-full whitespace-normal py-3 text-left transition-transform duration-150",
                )}
              >
                Find professionals in {country.shortName ?? country.name}
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/countries"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                All countries
              </Link>
            </div>
          </Reveal>

          <Reveal
            delayMs={120}
            className="relative aspect-[2/1] w-full rounded-panel bg-white p-2 shadow-float"
          >
            <div className="relative h-full w-full">
              <Image
                src="/images/world-map.svg"
                alt={`World map with ${country.name} marked`}
                fill
                priority
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-contain"
              />
              <span
                className="absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action ring-2 ring-white"
                style={{ left: `${country.mapX}%`, top: `${country.mapY}%` }}
                aria-hidden
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
