import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { FaqAccordion, type FaqItem } from "@/components/shared/faq-accordion";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";
import { services } from "@/lib/home-content";
import { INDEXABLE, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about TaxAccountant.com's directory.",
  alternates: { canonical: "/faq" },
  robots: robotsFor(INDEXABLE),
};

/**
 * Honest Phase-1-scoped answers only. No pricing claims (none is approved
 * yet — PRD.md A-07), no verification claims beyond what the data actually
 * records, no promises about features that are not built.
 */
function buildFaq(): FaqItem[] {
  return [
    {
      question: "What is TaxAccountant.com?",
      answer:
        "A marketplace that helps you find tax and accounting professionals, searchable by the tax jurisdiction you need — not just by city or country. It is not a single accounting firm.",
    },
    {
      question: "What's the difference between \"country\" and \"tax jurisdiction\"?",
      answer:
        "Country is where a professional is located. Tax jurisdiction is the specific tax authority (like the IRS, HMRC or CRA) they're authorised to advise on. A professional based in one country can be authorised for a completely different jurisdiction, so the directory filters on them separately.",
    },
    {
      question: "How many countries and jurisdictions can I search?",
      answer: `${discoverableCountries.length} countries are currently open for discovery, covering ${jurisdictionOptions.length} tax jurisdictions across ${services.length} service categories. More are added as they're reviewed and approved.`,
    },
    {
      question: "Are the professionals on this site verified?",
      answer:
        "Each profile states its own review status honestly. Designations and credentials shown are self-declared unless a profile specifically says it has been reviewed — we do not display an unearned \"verified\" badge.",
    },
    {
      question: "Is it free to search?",
      answer: "Yes. Searching the directory and viewing public profiles never requires an account or payment.",
    },
    {
      question: "How much does it cost to work with a professional I find?",
      answer:
        "We don't set or publish professional fees. Any pricing is between you and the professional, and we don't have approved pricing information to show on this site yet.",
    },
    {
      question: "I'm a tax or accounting professional — can I list myself?",
      answer:
        "Professional registration and onboarding are planned for a later phase. Visit the For Professionals page for what's planned and to register your interest in the meantime.",
    },
    {
      question: "Can I book an appointment or message someone through the site?",
      answer:
        "Not yet. Today the directory supports search and comparison only. Booking and messaging are planned for a later phase.",
    },
    {
      question: "How do I report incorrect information on a profile?",
      answer: "Use the Contact page and describe what looks wrong — our staff reviews every message.",
    },
  ];
}

export default function FaqPage() {
  const items = buildFaq();

  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} structuredData />
          <Reveal className="flex flex-col gap-4">
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              Frequently asked questions
            </h1>
            <p className="max-w-[62ch] text-lead text-slate">
              Can&apos;t find your answer here? The{" "}
              <a href="/contact" className="font-medium text-action hover:underline">
                Contact page
              </a>{" "}
              reaches our staff directly.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="max-w-[72ch] py-16 sm:py-20">
        {/* sr-only: the footer's own `<h3>` column titles follow this
            section, and native <details>/<summary> correctly carries no
            heading of its own — without this, a screen-reader user jumps
            straight from the page's h1 to the footer's h3. */}
        <h2 className="sr-only">Questions</h2>
        <FaqAccordion items={items} structuredData />
      </Container>
    </>
  );
}
