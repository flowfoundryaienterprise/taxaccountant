import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, FileCheck2, UserCog } from "lucide-react";

import { Container } from "@/components/layout/container";
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
    <Container className="flex flex-col gap-10 py-16">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tint px-3 py-1 text-caption font-semibold text-action">
          Phase 2 feature
        </span>
        <h1 className="text-heading-lg font-semibold text-navy">
          Professional registration opens in Phase 2
        </h1>
        <p className="max-w-[60ch] text-lead text-slate">
          Today, TaxAccountant.com is a Phase 1 public directory. Here's what's planned once
          professional accounts and credential review ship in Phase 2.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex flex-col gap-3 rounded-card border border-border bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-compact font-semibold text-white">
                {index + 1}
              </span>
              <Icon className="h-5 w-5 text-action" aria-hidden />
              <h2 className="text-compact font-semibold text-navy">{step.title}</h2>
              <p className="text-compact text-slate">{step.description}</p>
            </div>
          );
        })}
      </div>

      <Link href="/" className="text-compact font-semibold text-action">
        &larr; Back to the homepage
      </Link>
    </Container>
  );
}
