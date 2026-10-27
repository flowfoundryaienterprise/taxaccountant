import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceFaq } from "@/components/services/service-faq";
import { ServiceGrid } from "@/components/services/service-grid";
import { ServicesHero } from "@/components/services/services-hero";
import {
  AudienceSplit,
  ChoosingGuide,
  CrossBorderNote,
  DiscoverySteps,
} from "@/components/services/services-guidance";
import { directoryHref } from "@/lib/marketplace/query-params";
import { serviceCatalog } from "@/lib/marketplace/services";

export const metadata: Metadata = {
  title: "Tax & Accounting Services",
  description:
    "Explore tax and accounting service categories and find professionals with expertise relevant to your situation and tax jurisdiction.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Tax & Accounting Services for Every Need",
    description:
      "Explore tax and accounting service categories and find professionals with expertise relevant to your situation and tax jurisdiction.",
    url: "/services",
    type: "website",
  },
  /*
   * Indexable. Unlike `/find-accountant`, nothing on this page is a
   * professional listing: the content is reviewed editorial description of
   * what each category of work involves, with no prices, no coverage claims
   * and no fabricated inventory.
   */
  robots: { index: true, follow: true },
};

const indexFaqs = [
  {
    question: "Does TaxAccountant.com provide these services itself?",
    answer:
      "No. This is a discovery platform. Services are provided by independent professionals and firms, and any engagement is directly between you and them.",
  },
  {
    question: "Why are no prices shown?",
    answer:
      "Fees are set by each professional and depend on the work. No pricing, quoting or payment feature exists on the platform, so publishing a figure here would be inventing one.",
  },
  {
    question: "Is every service available in every country?",
    answer:
      "No. What is available depends on who is listed for a given tax jurisdiction and on that jurisdiction's own rules about who may do the work. Country pages show only the categories actually represented for that country.",
  },
  {
    question: "What is the difference between a country and a tax jurisdiction?",
    answer:
      "A country is where a professional is located. A tax jurisdiction is a tax authority they state they are authorized to act for. The two are independent, and the directory filters on them separately so neither implies the other.",
  },
  {
    question: "Can I get tax advice from these pages?",
    answer:
      "No. These pages describe what each category of work generally involves so you can find someone qualified. They are not advice about your own circumstances, and they publish no rates, thresholds or deadlines for any country.",
  },
];

/**
 * Service discovery index.
 *
 * A plain Server Component: the content is static and comes from
 * `@/lib/marketplace/services`, which joins the homepage service vocabulary
 * to its editorial detail. When `services:listPublished` (API.md section 2)
 * exists, this page reads it instead and the sections below are unchanged.
 */
export default function ServicesPage() {
  return (
    <>
      <ServicesHero />

      <section id="service-categories" className="py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Service categories"
            title="Browse every service category"
            description="Each category explains what the work normally covers, who it suits, and the jurisdiction limits that apply before you start a search."
          />
          <ServiceGrid services={serviceCatalog} columns={4} />
        </Container>
      </section>

      <ChoosingGuide />
      <AudienceSplit />
      <CrossBorderNote />
      <DiscoverySteps />

      <ServiceFaq
        items={indexFaqs}
        description="How service discovery works here, and what this platform deliberately does not do."
        structuredData
      />

      <MarketplaceCta
        title="Ready to find a professional?"
        description="Search the directory by country, tax jurisdiction, service and language — or start from a service category above."
        primary={{ label: "Find an Accountant", href: directoryHref() }}
        secondary={{ label: "Browse countries", href: "/countries" }}
        note="Directory results are currently development examples used to build and test the search. Designations shown are self-declared and unverified."
      />
    </>
  );
}
