import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, Mail, Search } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { INDEXABLE, robotsFor } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "Help",
  description: "Where to get help with TaxAccountant.com.",
  alternates: { canonical: "/help" },
  robots: robotsFor(INDEXABLE),
};

const channels = [
  {
    icon: Search,
    title: "Search the directory",
    description: "Filter by country, tax jurisdiction, service and language to find a professional.",
    href: "/find-accountant",
    cta: "Open the directory",
  },
  {
    icon: HelpCircle,
    title: "Check the FAQ",
    description: "Common questions about how the directory works, answered directly.",
    href: "/faq",
    cta: "Read the FAQ",
  },
  {
    icon: Mail,
    title: "Contact our staff",
    description: "For anything else, including reporting incorrect profile information.",
    href: "/contact",
    cta: "Go to Contact",
  },
];

/**
 * There is no live chat, phone line or ticketing system — the footer's
 * "Live Chat" label stays plain text because of that. This page is
 * deliberately three honest options, not a support portal that doesn't
 * exist yet.
 */
export default function HelpPage() {
  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-12 sm:py-16">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help" }]} structuredData />
          <Reveal className="flex flex-col gap-4">
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
              How can we help?
            </h1>
            <p className="max-w-[62ch] text-lead text-slate">
              Three places to start — there is no live chat or phone support yet, so these are the
              real options today.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {channels.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <Reveal key={channel.title} delayMs={index * 90}>
                <Link
                  href={channel.href}
                  className="group flex h-full flex-col gap-4 rounded-card border border-border bg-white p-6 transition-colors duration-150 hover:border-action"
                >
                  <Icon className="h-[18px] w-[18px] text-slate" aria-hidden />
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-compact font-medium text-navy">{channel.title}</h2>
                    <p className="text-compact text-slate">{channel.description}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-compact font-medium text-action">
                    {channel.cta}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </>
  );
}
