import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, FileCheck2, UserCog } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { PHASE_GATED, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "For Professionals",
  description: "How professional onboarding and verification will work once Phase 2 opens.",
  alternates: { canonical: "/for-professionals" },
  openGraph: {
    title: "For Tax Professionals | TaxAccountant.com",
    description:
      "How professional onboarding and credential verification will work when Phase 2 opens.",
    url: "/for-professionals",
    type: "website",
  },
  /*
   * Day 8: this page explains a capability that has not launched — there is
   * no onboarding to begin and no account to create. Indexing it would put
   * a page in search results that cannot do what a searcher arriving on it
   * would be looking for.
   */
  robots: robotsFor(PHASE_GATED),
};

const steps = [
  {
    title: "Create your professional identity",
    description: "Business identity, jurisdiction licenses and team setup, built on Better Auth.",
    icon: UserCog,
  },
  {
    title: "Submit credentials for review",
    description: "Private, reviewed uploads — never a self-applied verified badge.",
    icon: FileCheck2,
  },
  {
    title: "Go live once approved",
    description: "Only staff-approved, published profiles appear in public search.",
    icon: BadgeCheck,
  },
];

/**
 * PRD.md section 5 (Phase 2 "Professional onboarding") isn't built yet —
 * this is the "appropriate informational destination" the brief calls for
 * instead of a registration form that can't actually create an account.
 */
export default function ForProfessionalsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-tint/50">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 right-[4%] select-none text-[11rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[15rem]"
        >
          2
        </span>

        <Container className="relative flex flex-col gap-6 py-16 sm:py-20">
          <Reveal className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tint px-3 py-1 text-caption font-semibold text-action">
              Phase 2 feature
            </span>
            <h1 className="max-w-[18ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              Professional registration opens in Phase 2
            </h1>
            <p className="max-w-[60ch] text-lead text-slate">
              Today, TaxAccountant.com is a Phase 1 public directory. Here&apos;s what&apos;s
              planned once professional accounts and credential review ship in Phase 2.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="flex flex-col gap-10 py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1.15fr]">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delayMs={index * 90}>
                <div className="flex h-full flex-col gap-4 rounded-panel border border-border bg-white p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-caption font-medium tabular-nums text-slate">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-5 w-5 text-action" aria-hidden />
                  </div>
                  <h2 className="text-compact font-semibold text-navy">{step.title}</h2>
                  <p className="text-compact text-slate">{step.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-1.5 text-compact font-semibold text-action"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to the homepage
        </Link>
      </Container>
    </>
  );
}
