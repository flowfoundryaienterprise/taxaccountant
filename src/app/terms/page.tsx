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
 * exists so the link works without inventing legal terms.
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
            A public directory for discovering tax and accounting professionals. Browsing does not
            require an account. Customer enquiries and professional accounts require sign-in.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this site does not do</h2>
          <p>
            This site does not provide tax, legal or financial advice or book appointments. It does
            not collect customer payments for services supplied by professionals. Professional
            subscriptions can be billed through Stripe when billing is configured. A credential is
            reviewed only when the profile explicitly shows that status; profile information should
            be confirmed with the professional before engagement.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this page does not cover yet</h2>
          <p>
            Account and subscription terms, cancellation and refund rules, liability limitations,
            dispute resolution and acceptable-use rules require legal approval. A reviewed terms of
            service must replace this draft before release.
          </p>
        </section>
      </div>
    </Container>
  );
}
