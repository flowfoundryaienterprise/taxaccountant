import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { Button } from "@/components/ui/button";
import { howItWorksSteps } from "@/lib/home-content";
import { INDEXABLE, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How searching TaxAccountant.com's directory works today, and what's planned for later phases.",
  alternates: { canonical: "/how-it-works" },
  robots: robotsFor(INDEXABLE),
};

const roadmapFaq = [
  {
    question: "Can I book a consultation or message a professional directly?",
    answer:
      "Not yet. Phase 1 is public discovery only — you can search, compare and view profiles. Direct messaging and consultation booking are planned for a later phase.",
  },
  {
    question: "Is anything on a profile verified?",
    answer:
      "Designations shown today are self-declared by the source data, not independently verified by TaxAccountant.com. A profile states its review status honestly rather than defaulting to \"verified.\"",
  },
  {
    question: "Is there a cost to search the directory?",
    answer: "No. Searching and viewing public profiles is free and does not require an account.",
  },
  {
    question: "What happens after I find a professional I'm interested in?",
    answer:
      "Each profile's \"Contact Professional\" action routes to what's actually available at this phase — today, that's our public enquiry form, not a direct line to the professional.",
  },
];

/**
 * Deeper version of the homepage's four-step teaser (`#how-it-works`), not
 * a duplicate of it — each step gets a real explanation here, plus the
 * honest roadmap context (what works now vs. later phases) that a
 * four-card homepage section has no room for.
 */
export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "How It Works" }]} structuredData />
          <Reveal className="flex flex-col gap-4">
            <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              How It Works
            </h1>
            <p className="max-w-[68ch] text-lead text-slate">
              Four steps that work today, and an honest account of what comes after — this
              marketplace is being built in phases, and this page says which phase each part of
              the journey is in.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="flex flex-col gap-16 py-16 sm:py-20">
        <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {howItWorksSteps.map((step, index) => (
            <Reveal key={step.step} delayMs={index * 80}>
              <li className="relative flex flex-col gap-3 border-t border-border pt-6">
                <span
                  aria-hidden
                  className="font-mono text-caption font-medium tabular-nums text-action"
                >
                  Step {String(step.step).padStart(2, "0")}
                </span>
                <h2 className="text-heading-sm font-semibold text-navy">{step.title}</h2>
                <p className="max-w-[48ch] text-compact text-slate">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            What works now, what's next
          </h2>
          <FaqAccordion items={roadmapFaq} />
        </div>

        <Reveal className="flex flex-col items-start gap-4 rounded-panel bg-navy px-6 py-10 text-white sm:px-10">
          <h2 className="text-heading-lg font-semibold">Ready to search?</h2>
          <p className="max-w-[56ch] text-lead text-white/80">
            Filter by country, tax jurisdiction, service and language — no account required.
          </p>
          <Link href="/find-accountant">
            <Button size="lg" className="group">
              Find an Accountant
              <ArrowRight
                className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Button>
          </Link>
        </Reveal>
      </Container>
    </>
  );
}
