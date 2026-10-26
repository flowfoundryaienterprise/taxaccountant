import Link from "next/link";
import { MapPinOff } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { countryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

/**
 * Unknown country code — not a real ISO 3166-1 alpha-2 country we hold, or
 * a mistyped URL. Distinct from `CountryUnavailable`, which answers for a
 * country that exists but is not open for discovery.
 */
export default function CountryNotFound() {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Countries", href: "/countries" },
          { label: "Not found" },
        ]}
      />

      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <MapPinOff className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-heading-lg font-semibold text-navy">
            We do not have a page for that country code
          </h1>
          <p className="max-w-[64ch] text-lead text-slate">
            Country pages use two-letter ISO 3166-1 codes, for example{" "}
            <span className="font-mono text-navy">/countries/GB</span>. The countries currently
            open for discovery are listed below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/countries" className={cn(buttonVariants({ size: "md" }))}>
            All countries
          </Link>
          <Link
            href="/find-accountant"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Find an Accountant
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
            Back to homepage
          </Link>
        </div>
      </div>

      {discoverableCountries.length ? (
        <ul className="flex flex-wrap gap-2">
          {discoverableCountries.map((country) => (
            <li key={country.code}>
              <Link
                href={countryHref(country.code)}
                className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-compact text-navy transition-colors duration-150 hover:border-action hover:text-action"
              >
                {country.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Container>
  );
}
