import type { Metadata } from "next";
import Link from "next/link";
import { Construction } from "lucide-react";

import { Container } from "@/components/layout/container";
import { searchCountries, services } from "@/lib/home-content";

export const metadata: Metadata = {
  title: "Find an Accountant",
  description:
    "The professional directory search is launching next in Phase 1. See what's confirmed so far.",
};

interface FindAccountantPageProps {
  searchParams: Promise<{ country?: string; service?: string }>;
}

/**
 * Honest placeholder for IMPLEMENTATION_PLAN.md Day 9 ("directory query and
 * cursor pagination"). The homepage search, service cards and country tiles
 * all land here with their selections preserved in the URL — the directory
 * build reads the same query params once it ships, per the Day 2 brief:
 * "preparing the form for the directory implementation on Day 3."
 */
export default async function FindAccountantPage({ searchParams }: FindAccountantPageProps) {
  const { country, service } = await searchParams;

  const countryLabel = searchCountries.find((item) => item.code === country)?.name;
  const serviceLabel = services.find((item) => item.slug === service)?.title;

  return (
    <Container className="flex flex-col gap-8 py-16">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tint px-3 py-1 text-caption font-semibold text-action">
          <Construction className="h-3.5 w-3.5" aria-hidden />
          Launching Phase 1, Day 3
        </span>
        <h1 className="text-heading-lg font-semibold text-navy">
          The professional directory is almost here
        </h1>
        <p className="max-w-[60ch] text-lead text-slate">
          Search, filters and cursor pagination across country, tax jurisdiction and service are
          the next build in this phase. Nothing here is a real listing yet.
        </p>
      </div>

      {country || service ? (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-6">
          <h2 className="text-compact font-semibold text-navy">Your search was captured</h2>
          <p className="text-compact text-slate">
            Once the directory ships, this exact selection will return real results:
          </p>
          <dl className="flex flex-wrap gap-6">
            <div>
              <dt className="text-caption uppercase tracking-wide text-slate">Country</dt>
              <dd className="text-compact font-medium text-navy">{countryLabel ?? "Any country"}</dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-wide text-slate">Service</dt>
              <dd className="text-compact font-medium text-navy">{serviceLabel ?? "Any service"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <Link href="/" className="text-compact font-semibold text-action">
        &larr; Back to the homepage
      </Link>
    </Container>
  );
}
