import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { ResourceCard } from "@/components/resources/resource-card";
import { TAX_CONTENT_DISCLAIMER } from "@/lib/cms/content-formatters";
import { publicContentRepository } from "@/lib/cms/public-content-adapter";
import { toResourceCard } from "@/lib/marketplace/public-content-types";

export const metadata: Metadata = {
  title: "Guides & Resources",
  description:
    "Reviewed guides about tax and accounting topics, written in general terms and scoped to the jurisdiction they describe.",
  alternates: { canonical: "/resources" },
  /*
   * Indexable, and safe to be: this route serves only published resources
   * that carry a recorded editorial review, and there are currently none —
   * so it indexes an honest empty state rather than fictional content. That
   * is the opposite of the directory and profile routes, which are noindex
   * precisely because they render development fixtures.
   */
  robots: { index: true, follow: true },
};

/**
 * Public resources index.
 *
 * Reads through `publicContentRepository`, which returns only published,
 * reviewed, public-safe projections. No CMS fixture is reachable from here:
 * the demonstration articles in the CMS are staff-side records, and routing
 * this page at them would put fictional tax content on an indexable public
 * page under a real brand.
 *
 * Today that repository is genuinely empty, so this renders its empty state.
 * That is the truthful position — nothing has been written and reviewed yet —
 * and it is also the clearest possible demonstration that unpublished
 * content does not reach the public site.
 */
export default async function ResourcesPage() {
  const { items } = await publicContentRepository.listArticles();
  const cards = items.map(toResourceCard);

  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Guides & Resources" }]}
            structuredData
          />

          <div className="flex flex-col gap-3">
            <h1 className="max-w-[24ch] text-hero font-semibold text-navy">
              Guides &amp; Resources
            </h1>
            <p className="max-w-[70ch] text-lead text-slate">
              General explanations of how tax and accounting work across jurisdictions. Every
              resource published here carries the date it was last reviewed, and the tax
              jurisdiction it describes where that matters.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Resources"
            title={cards.length ? "Published guides" : "No guides have been published yet"}
          />

          {cards.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Nothing has been published here yet"
              description="Guides are written and then reviewed by an authorized professional before they appear. Rather than fill this page with generic or unreviewed material, it stays empty until there is something worth reading."
              tone="panel"
              actions={[
                { label: "Find an Accountant", href: "/find-accountant" },
                { label: "Browse services", href: "/services", variant: "outline" },
              ]}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <li key={card.slug} className="flex">
                  <ResourceCard resource={card} />
                </li>
              ))}
            </ul>
          )}

          <p className="max-w-[80ch] rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate">
            {TAX_CONTENT_DISCLAIMER}
          </p>
        </Container>
      </section>

      <MarketplaceCta
        title="Looking for help with a specific tax position?"
        description="Guides describe how things generally work. For anything that depends on your own circumstances, the directory filters by tax jurisdiction, service and language."
        primary={{ label: "Find an Accountant", href: "/find-accountant" }}
        secondary={{ label: "Browse services", href: "/services" }}
        note="Confirm authorization for your tax jurisdiction, the scope of the work and the fee directly with any professional you contact."
      />
    </>
  );
}
