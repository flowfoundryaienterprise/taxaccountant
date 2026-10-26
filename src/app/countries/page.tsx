import type { Metadata } from "next";
import { Globe2 } from "lucide-react";

import { CountriesHero } from "@/components/countries/countries-hero";
import { CountrySearch } from "@/components/countries/country-search";
import type { CountryCardData } from "@/components/countries/country-card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  countriesByRegion,
  discoverableCountries,
  jurisdictionsForCountry,
  servicesForCountry,
} from "@/lib/marketplace/countries";
import { directoryHref } from "@/lib/marketplace/query-params";

export const metadata: Metadata = {
  title: "Find Tax Accountants by Country",
  description:
    "Explore tax and accounting professionals by country and find expertise for the jurisdictions that matter to you.",
  alternates: { canonical: "/countries" },
  openGraph: {
    title: "Find Tax Accountants Around the World",
    description:
      "Explore tax and accounting professionals by country and find expertise for the jurisdictions that matter to you.",
    url: "/countries",
    type: "website",
  },
  /*
   * Not indexable yet. The service coverage shown per country is derived
   * from Day 3 development fixtures rather than from published
   * professionals, and `countries:listDiscoverable` (API.md section 2) does
   * not exist. Indexing now would publish coverage signals that are not yet
   * real. Flip to `index: true` when the country catalogue and its service
   * coverage come from Convex.
   */
  robots: { index: false, follow: true },
};

/**
 * Country discovery index.
 *
 * Server Component: the catalogue, each country's jurisdiction count and its
 * genuinely-represented service categories are all resolved here, then handed
 * to the client search component as plain data. The client never imports the
 * fixtures, so there is exactly one place where "what is discoverable" is
 * decided.
 */
export default function CountriesPage() {
  const countries: CountryCardData[] = discoverableCountries.map((country) => ({
    code: country.code,
    name: country.name,
    region: country.region,
    serviceTitles: servicesForCountry(country.code).map((service) => service.title),
    jurisdictionCount: jurisdictionsForCountry(country.code).length,
  }));

  const regionOrder = countriesByRegion(discoverableCountries).map((group) => group.region);

  const markers = discoverableCountries.map((country) => ({
    code: country.code,
    name: country.name,
    mapX: country.mapX,
    mapY: country.mapY,
  }));

  return (
    <>
      <CountriesHero markers={markers} />

      <section id="country-directory" className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Countries"
            title="Explore by country"
            description="Each country page sets out the tax jurisdictions that exist there, the service categories currently represented, and a filtered route into the directory."
          />

          {countries.length === 0 ? (
            <EmptyState
              icon={Globe2}
              title="No countries are open for discovery yet"
              description="Countries appear here once their jurisdiction and service configuration has been approved. Nothing is listed in the meantime."
              tone="panel"
              actions={[{ label: "Find an Accountant", href: "/find-accountant" }]}
            />
          ) : (
            <CountrySearch countries={countries} regionOrder={regionOrder} />
          )}
        </Container>
      </section>

      <section className="bg-tint/50 py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
          <SectionHeading
            eyebrow="Before you search"
            title="Country, jurisdiction, location and authorization"
            description="Four things this site keeps deliberately separate, because conflating them is how people end up with the wrong professional."
          />

          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              {
                term: "Professional location",
                detail: "The city and country a professional works from. Nothing more.",
              },
              {
                term: "Customer location",
                detail: "Where you are. It does not determine where you have to file.",
              },
              {
                term: "Tax jurisdiction",
                detail: "A tax authority whose rules apply to a filing or obligation.",
              },
              {
                term: "Professional authorization",
                detail:
                  "Permission to act for a specific tax jurisdiction, granted by that jurisdiction.",
              },
            ].map((item) => (
              <div
                key={item.term}
                className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-5"
              >
                <dt className="text-compact font-semibold text-navy">{item.term}</dt>
                <dd className="text-compact text-slate">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <MarketplaceCta
        title="Search across every listed country"
        description="The directory filters country and tax jurisdiction separately, so you can look for someone authorized where you file rather than someone who happens to be nearby."
        primary={{ label: "Find an Accountant", href: directoryHref() }}
        secondary={{ label: "Browse services", href: "/services" }}
        note="Country listings describe configured jurisdictions and service categories. They are not a claim that a given professional is authorized in that country."
      />
    </>
  );
}
