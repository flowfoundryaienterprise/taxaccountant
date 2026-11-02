import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { LEGAL_PENDING_APPROVAL, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: robotsFor(LEGAL_PENDING_APPROVAL),
};

/**
 * Same placeholder treatment as /privacy, and for the same reason — no
 * terms of service have been drafted or approved (PRD.md A-05). This page
 * exists so the link works and says what's actually true (Phase 1 scope,
 * no transactions yet) instead of either 404ing or inventing legal terms.
 */
export default function TermsPage() {
  return (
    <Container className="flex max-w-[72ch] flex-col gap-8 py-16 sm:py-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />

      <Reveal className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Terms of service
        </h1>
        <p className="flex gap-2 rounded-card border border-warning/30 bg-white px-4 py-3 text-compact text-slate">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            This page is a placeholder pending legal review, not a final terms of service. It is
            not indexed by search engines for that reason.
          </span>
        </p>
      </Reveal>

      <div className="flex flex-col gap-6 text-body text-slate">
        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What TaxAccountant.com is today</h2>
          <p>
            A public directory for discovering tax and accounting professionals by country, tax
            jurisdiction, service and language. Browsing and searching are free and do not require
            an account.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this site does not do</h2>
          <p>
            This site does not provide tax, legal or financial advice, does not book appointments,
            does not process payments, and does not independently verify every credential shown on
            a profile unless a profile specifically states it has been reviewed. Information about
            a professional is provided by that professional or sourced from public records and is
            not guaranteed accurate.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this page does not cover yet</h2>
          <p>
            Account terms, liability limitations, dispute resolution and acceptable-use rules are
            not finalised. A reviewed, approved terms of service will replace this page before any
            of those are claimed.
          </p>
        </section>
      </div>
    </Container>
  );
}
