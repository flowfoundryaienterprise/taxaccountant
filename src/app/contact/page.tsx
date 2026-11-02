import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { INDEXABLE, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with TaxAccountant.com.",
  alternates: { canonical: "/contact" },
  robots: robotsFor(INDEXABLE),
};

/**
 * This is a **nontransactional** interest/contact form, not a quote
 * request, booking or lead sale (PRD.md P1-F08) — the form and the page
 * copy both say so, so nobody submits expecting a quote.
 */
export default function ContactPage() {
  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} structuredData />
          <Reveal className="flex flex-col gap-4">
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              Get in touch
            </h1>
            <p className="max-w-[62ch] text-lead text-slate">
              A message to our staff — not a quote request or booking. We don&apos;t offer tax
              advice, and please don&apos;t include tax ID numbers, account numbers, or tax
              documents in your message.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="max-w-[72ch] py-16 sm:py-20">
        <EnquiryForm
          kind="contact"
          successTitle="Message sent"
          successBody="Thanks — our staff reviews every message. We don't yet send an automated email receipt, so this confirmation is it."
        />
      </Container>
    </>
  );
}
