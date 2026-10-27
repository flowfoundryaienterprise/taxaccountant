import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { CountryJurisdictions } from "@/components/countries/country-jurisdictions";
import { CountryOverview } from "@/components/countries/country-overview";
import { CountryServices } from "@/components/countries/country-services";
import { CountryUnavailable } from "@/components/countries/country-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import { ProfessionalPreview } from "@/components/shared/professional-preview";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceFaq } from "@/components/services/service-faq";
import { filterProfessionals } from "@/lib/directory/filters";
import { directoryFixtures } from "@/lib/directory/fixtures";
import { EMPTY_FILTERS } from "@/lib/directory/query-params";
import {
  discoverableCountryCodes,
  getCountry,
  isDiscoverable,
  jurisdictionsForCountry,
  resourcesForCountry,
  servicesForCountry,
} from "@/lib/marketplace/countries";
import { countryHref, directoryHref } from "@/lib/marketplace/query-params";

interface CountryDetailPageProps {
  params: Promise<{ countryCode: string }>;
}

/**
 * Only discoverable countries are pre-rendered. Non-discoverable ones still
 * resolve on demand — to the honest "not open yet" state, not to a
 * fabricated listing — and unknown codes 404.
 */
export function generateStaticParams() {
  return discoverableCountryCodes.map((countryCode) => ({ countryCode }));
}

export async function generateMetadata({ params }: CountryDetailPageProps): Promise<Metadata> {
  const { countryCode } = await params;
  const country = getCountry(countryCode);

  if (!country) {
    return { title: "Country not found", robots: { index: false, follow: true } };
  }

  if (!isDiscoverable(country)) {
    return {
      title: `${country.name} — not yet available`,
      description: `TaxAccountant.com is not listing tax and accounting professionals for ${country.name} yet.`,
      alternates: { canonical: countryHref(country.code) },
      robots: { index: false, follow: true },
    };
  }

  const description = `Explore tax jurisdictions, service categories and tax and accounting professionals listed for ${country.name} on TaxAccountant.com.`;

  return {
    title: `Tax Accountants in ${country.name}`,
    description,
    // Canonical is always the uppercase ISO form, so `/countries/us` and
    // `/countries/US` resolve to one indexable address rather than two.
    alternates: { canonical: countryHref(country.code) },
    openGraph: {
      title: `Tax & Accounting Professionals in ${country.name}`,
      description,
      url: countryHref(country.code),
      type: "website",
    },
    /*
     * Not indexable yet, for the same reason as `/countries`: the service
     * coverage on this page is derived from Day 3 development fixtures, not
     * from published professionals. Flip to `index: true` once
     * `countries:listDiscoverable` and `professionals:search` back it.
     */
    robots: { index: false, follow: true },
  };
}

function countryFaqs(countryName: string) {
  return [
    {
      question: `Does a professional listed in ${countryName} mean they can file my ${countryName} taxes?`,
      answer:
        "Not on its own. Being listed under a country describes where a professional works from. Whether they may act for a particular tax authority is a separate fact, shown as their tax jurisdictions, and granted by that jurisdiction rather than by this platform. Confirm it directly before engaging anyone.",
    },
    {
      question: `Are the professionals shown for ${countryName} verified?`,
      answer:
        "No. Designations in the directory are self-declared and are labelled unverified. Credential review is a later phase of this platform, and no badge is applied until a documented review has taken place.",
    },
    {
      question: `Can I find someone outside ${countryName} who is authorized here?`,
      answer:
        "Yes, and that is why the directory filters country and tax jurisdiction separately. Filtering by a jurisdiction returns everyone who states authorization for it, wherever they are based.",
    },
    {
      question: `Does TaxAccountant.com publish tax rates or filing deadlines for ${countryName}?`,
      answer:
        "No. Rates, thresholds, deadlines and regulatory requirements are not published anywhere on this site. They change, they depend on circumstances, and publishing them without review would be worse than publishing nothing.",
    },
    {
      question: `What does it cost to work with a professional in ${countryName}?`,
      answer:
        "Fees are set by each professional. The platform has no pricing, quoting or payment feature, so no figures are shown and none should be inferred.",
    },
  ];
}

/**
 * Reusable country detail template.
 *
 * Three distinct outcomes, all of them honest:
 *  - unknown code → `notFound()`;
 *  - known but not discoverable → the "not open yet" state, no listings;
 *  - discoverable → jurisdictions, genuinely-represented services and a
 *    filtered route into the directory.
 */
export default async function CountryDetailPage({ params }: CountryDetailPageProps) {
  const { countryCode } = await params;
  const country = getCountry(countryCode);

  if (!country) notFound();
  if (!isDiscoverable(country)) return <CountryUnavailable country={country} />;

  const jurisdictions = jurisdictionsForCountry(country.code);
  const services = servicesForCountry(country.code);
  const resources = resourcesForCountry(country.code);

  const professionals = filterProfessionals(directoryFixtures, {
    ...EMPTY_FILTERS,
    countries: [country.code],
  });

  const countryDirectoryHref = directoryHref({ country: country.code });

  return (
    <>
      <CountryOverview country={country} />
      <CountryServices country={country} services={services} />
      <CountryJurisdictions country={country} jurisdictions={jurisdictions} />

      <section id="find-accountants" className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Find accountants"
            title={`Professionals located in ${country.name}`}
            description="Opening the directory from here keeps this country selected. Add a tax jurisdiction, service or language on top of it — the country filter stays in the URL."
          />

          <ProfessionalPreview
            professionals={professionals}
            directoryHref={countryDirectoryHref}
            directoryLabel={`See all professionals in ${country.shortName ?? country.name}`}
            subject={country.name}
          />
        </Container>
      </section>

      <ServiceFaq
        id="country-faqs"
        items={countryFaqs(country.name)}
        title={`Finding a professional in ${country.name}`}
        eyebrow="Country FAQs"
        description="How discovery works for this country, and what this site deliberately does not publish about it."
        tone="tinted"
      />

      <section id="resources" className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Resources"
            title={`Guides and resources for ${country.name}`}
          />

          {resources.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={`No ${country.name} guides have been published yet`}
              description="Country guides are written and reviewed before they appear here. Rather than filling this section with generic material, it stays empty until there is something worth reading."
              actions={[
                { label: "Find an Accountant", href: countryDirectoryHref },
                { label: "Browse services", href: "/services", variant: "outline" },
              ]}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <li
                  key={resource.href}
                  className="flex flex-col gap-2 rounded-card border border-border bg-white p-6"
                >
                  <h3 className="text-compact font-semibold text-navy">{resource.title}</h3>
                  <p className="text-compact text-slate">{resource.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <MarketplaceCta
        title={`Find professionals in ${country.name}`}
        description="The directory filters country and tax jurisdiction separately, so you can search for someone authorized where you file rather than someone who is simply nearby."
        primary={{ label: `Find professionals in ${country.shortName ?? country.name}`, href: countryDirectoryHref }}
        secondary={{ label: "All countries", href: "/countries" }}
        note="Listing a country describes its configured jurisdictions and the service categories currently represented. It is not a claim that any professional is authorized there."
      />
    </>
  );
}
