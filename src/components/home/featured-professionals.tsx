import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { loadDirectory } from "@/lib/directory/public-directory";
import { toCardModel } from "@/lib/directory/card-model";

import { professionalHref } from "@/lib/marketplace/query-params";

export async function FeaturedProfessionals() {
  let directory: Awaited<ReturnType<typeof loadDirectory>> | null = null;
  try {
    directory = await loadDirectory();
  } catch {
    // Keep the rest of the homepage available when the public data service fails.
  }
  const featured = directory?.items.slice(0, 6).map(row => ({slug:row.slug,card:toCardModel(row)})) ?? [];
  return (
    <section id="professionals" className="bg-tint py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Meet the professionals"
            title="Accountants & tax specialists."
            description="Explore approved professionals by expertise and location."
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
          >
            View all professionals
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ slug, card }) => (
            <div key={slug}>
              <ProfessionalCard
                compact
                example={directory?.preview ?? false}
                professional={card}
                profileHref={professionalHref(slug)}
                className="h-full"
                sizes="(min-width: 1024px) 33vw, 50vw"
              />
            </div>
          ))}
        </div>

        {!directory ? <p role="alert" className="rounded-card border border-border bg-white p-8 text-slate">Professional listings are temporarily unavailable. <Link href="/find-accountant" className="text-action underline">Try again</Link>.</p> : !featured.length ? <p className="rounded-card border border-border bg-white p-8 text-slate">Approved professional listings will appear here when available.</p> : null}
      </Container>
    </section>
  );
}
