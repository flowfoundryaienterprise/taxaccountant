import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";
import { services } from "@/lib/home-content";
import { INDEXABLE, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "About",
  description:
    "TaxAccountant.com is a global marketplace for finding tax and accounting professionals by jurisdiction, not just location.",
  alternates: { canonical: "/about" },
  robots: robotsFor(INDEXABLE),
};

const principles = [
  {
    title: "Jurisdiction before geography",
    description:
      "Where you live, where you need to file, and where a professional is authorised to practise are three different facts. We keep them as three different filters, not one.",
  },
  {
    title: "Trust before scale",
    description:
      "No fake profiles, reviews, ratings, credentials, availability or client counts. If we have not verified something, we say so rather than imply it.",
  },
  {
    title: "Public discovery first",
    description:
      "A working directory you can search without an account comes before customer and professional accounts — those are a later phase, built on top of this foundation.",
  },
  {
    title: "Minimise sensitive information",
    description:
      "We do not ask for tax ID numbers or tax documents through any public page, including this one's contact form.",
  },
];

/**
 * Real content only — drawn directly from documents/PRD.md section 1
 * ("Product statement", "Product principles"), not invented for this page.
 * No team photos, no founding story, no customer counts: none of that
 * exists yet for this project, and the site's own rule against fabricated
 * trust signals applies to this page as much as any other.
 */
export default function AboutPage() {
  return (
    <>
      <JsonLd data={[organizationJsonLd()]} />
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} structuredData />
          <Reveal className="flex flex-col gap-4">
            <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              A marketplace, not one firm&apos;s website
            </h1>
            <p className="max-w-[68ch] text-lead text-slate">
              TaxAccountant.com connects individuals and businesses with tax and accounting
              professionals around the world — searchable by the tax jurisdiction you actually
              need to file in, not just a city on a map.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="flex flex-col gap-14 py-16 sm:py-20">
        <Reveal className="flex max-w-[72ch] flex-col gap-4">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            What this is, today
          </h2>
          <p className="text-body text-slate">
            Right now, TaxAccountant.com is a Phase 1 public directory: search{" "}
            {jurisdictionOptions.length} tax jurisdictions across {discoverableCountries.length}{" "}
            countries by {services.length} service categories, and read professional profiles —
            all without creating an account. Customer and professional accounts, credential
            verification, booking, secure messaging and payments are planned for later phases and
            are not available yet. Nothing on this site implies otherwise.
          </p>
          <p className="text-body text-slate">
            Individuals and organisations use it to find professionals qualified for their
            specific situation; professionals will eventually use it to build a listing and reach
            that demand; our team manages the taxonomy, content and marketplace quality behind it.
          </p>
        </Reveal>

        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            What we build around
          </h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            {principles.map((principle, index) => (
              <Reveal key={principle.title} delayMs={index * 80}>
                <li className="flex flex-col gap-2 border-t border-border pt-5">
                  <h3 className="text-compact font-semibold text-navy">{principle.title}</h3>
                  <p className="text-compact text-slate">{principle.description}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </>
  );
}
