import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { CONSENT_VERSION } from "@/lib/legal/consent";
import { LEGAL_PENDING_APPROVAL, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "Privacy Notice",
  robots: robotsFor(LEGAL_PENDING_APPROVAL),
};

/**
 * Placeholder, not a policy — PRD.md section 13 approval item A-05 ("exact
 * page copy, trust claims, legal text... before launch") and section 12
 * ("Approval rule: develop behind a disabled feature flag with approved
 * test data; do not publish invented claims"). This page states only facts
 * already true of the codebase (what `convex/contact.ts` actually stores
 * and what it deliberately does not ask for), never a compliance claim
 * like "GDPR compliant" or a retention promise nobody has approved.
 */
export default function PrivacyPage() {
  return (
    <Container className="flex max-w-[72ch] flex-col gap-8 py-16 sm:py-20">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Notice" }]} />

      <Reveal className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Privacy notice
        </h1>
        <p className="flex gap-2 rounded-card border border-warning/30 bg-white px-4 py-3 text-compact text-slate">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span>
            This page is a placeholder pending legal review, not a final privacy policy. It is not
            indexed by search engines for that reason. It states only what is actually true of
            this site today.
          </span>
        </p>
      </Reveal>

      <div className="flex flex-col gap-6 text-body text-slate">
        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this site collects today</h2>
          <p>
            Browsing the directory, searching, and viewing professional profiles does not require
            an account and is not tied to your identity by this site. If you submit the{" "}
            <a href="/contact" className="font-medium text-action hover:underline">
              Contact form
            </a>
            , we store the name, email, optional phone number, subject and message you provide, so
            our staff can respond to you.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What we do not ask for</h2>
          <p>
            No page on this site — including the Contact form — asks for tax identification
            numbers, bank or account numbers, or tax documents. Please don&apos;t include them in a
            message to us.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">Cookies and analytics</h2>
          <p>
            Consent-aware analytics are planned but not yet active on this site. This section will
            be updated with real cookie and consent details once that is configured and approved.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm font-semibold text-navy">What this notice does not cover yet</h2>
          <p>
            Data retention periods, your rights to access or delete data we hold, and our legal
            basis for processing are not finalised. A reviewed, approved privacy policy will
            replace this page before those are claimed.
          </p>
        </section>

        <p className="text-caption text-slate/70">Notice version: {CONSENT_VERSION}</p>
      </div>
    </Container>
  );
}
