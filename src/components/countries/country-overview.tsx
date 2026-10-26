import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coins, Globe2, Languages } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { CountryBadge } from "@/components/countries/country-badge";
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
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Countries", href: "/countries" },
            { label: country.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <CountryBadge code={country.code} countryName={country.name} size="lg" />
              <span className="rounded-full border border-border bg-white px-3 py-1 text-caption font-semibold text-navy">
                {country.region}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="max-w-[22ch] text-hero font-semibold text-navy">
                Tax &amp; Accounting Professionals in {country.name}
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
                  "group h-auto max-w-full whitespace-normal py-3 text-left transition-transform duration-150 hover:-translate-y-0.5",
                )}
              >
                Find professionals in {country.shortName ?? country.name}
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
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
          </div>

          <div className="relative aspect-[2/1] w-full rounded-panel bg-white p-2 shadow-[0_28px_60px_-44px_rgba(16,44,87,0.5)]">
            <div className="relative h-full w-full">
              <Image
                src="/images/world-map.svg"
                alt={`World map with ${country.name} marked`}
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-contain"
              />
              <span
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${country.mapX}%`, top: `${country.mapY}%` }}
                aria-hidden
              >
                <span className="animate-marker-pulse absolute inset-0 rounded-full bg-action" />
                <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-action shadow-[0_0_0_4px_rgba(8,121,233,0.25)]" />
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
