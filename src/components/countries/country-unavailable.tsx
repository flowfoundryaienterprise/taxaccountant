import Link from "next/link";
import { MapPinOff } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { discoverableCountries, type CountryEntry } from "@/lib/marketplace/countries";
import { countryHref, directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

/**
 * A real country that is **not** open for public discovery
 * (`countries.discoverable === false`, or `status !== "published"`).
 *
 * This is not a 404 — the country exists and the honest answer is "not
 * yet", which is more useful than pretending the URL is meaningless. What
 * it must not do is fabricate a live country listing, so it shows no
 * jurisdictions, no services and no professionals, and the route is
 * `noindex`.
 *
 * The internal reason (`draft` vs `review` vs a disabled flag) is
 * deliberately not shown: that is unpublished operational state
 * (DATABASE.md Phase 1 invariants).
 */
export function CountryUnavailable({ country }: { country: CountryEntry }) {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Countries", href: "/countries" },
          { label: country.name },
        ]}
      />

      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <MapPinOff className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-heading-lg font-semibold text-navy">
            {country.name} is not open for discovery yet
          </h1>
          <p className="max-w-[66ch] text-lead text-slate">
            We are not listing tax jurisdictions, service categories or professionals for{" "}
            {country.name} on TaxAccountant.com at this stage. A country appears only once its
            configuration has been approved — showing a page now would imply coverage that does not
            exist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/countries" className={cn(buttonVariants({ size: "md" }))}>
            See countries open for discovery
          </Link>
          <Link
            href={directoryHref()}
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Search the full directory
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
            Back to homepage
          </Link>
        </div>
      </div>

      {discoverableCountries.length ? (
        <div className="flex flex-col gap-4 rounded-panel border border-border bg-tint/60 p-6 sm:p-8">
          <h2 className="text-compact font-semibold text-navy">Countries you can explore today</h2>
          <ul className="flex flex-wrap gap-2">
            {discoverableCountries.map((entry) => (
              <li key={entry.code}>
                <Link
                  href={countryHref(entry.code)}
                  className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-compact text-navy transition-colors duration-150 hover:border-action hover:text-action"
                >
                  {entry.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Container>
  );
}
