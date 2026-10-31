import Link from "next/link";
import { ArrowRight, Briefcase, Scale } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { jurisdictionLabel } from "@/lib/directory/taxonomy";
import { getService } from "@/lib/marketplace/services";
import { serviceHref } from "@/lib/marketplace/query-params";
import { profileName } from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";

/**
 * Services this professional offers — and only those.
 *
 * Each card is one `professionalServices` grouping: a service category plus
 * the tax jurisdictions that professional is listed for *in that category*.
 * The marketplace's other categories are not shown greyed out or otherwise
 * implied; a service nobody offers simply is not here (Day 5 brief section 6:
 * "Do not show every marketplace service as if each professional provides
 * it").
 *
 * Titles, descriptions and icons come from `serviceCatalog`, the same source
 * the Day 4 `/services/[slug]` pages render, so a card and the page it links
 * to can never describe the category differently.
 */
export function ProfessionalServices({ profile }: { profile: ProfessionalProfile }) {
  const name = profileName(profile);

  const entries = profile.services.flatMap((service) => {
    const catalog = getService(service.serviceSlug);
    // A service with no catalogue entry is a content gap, not a card.
    return catalog ? [{ service, catalog }] : [];
  });

  return (
    <section id="services" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-lg font-semibold text-navy">Services &amp; specialties</h2>
        <p className="max-w-[72ch] text-compact text-slate">
          The service categories {name} is listed for, each with the tax jurisdictions that
          listing covers. Follow a category to read what the work involves in general terms.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No service categories are listed yet"
          description="This profile has no enabled service entries, so none are shown. Browsing the service categories is the way to find professionals who do list them."
          actions={[
            { label: "Browse all services", href: "/services" },
            { label: "Open the directory", href: "/find-accountant", variant: "outline" },
          ]}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {entries.map(({ service, catalog }) => {
            const Icon = catalog.icon;

            return (
              <li key={service.serviceSlug} className="flex">
                <article className="group flex w-full flex-col gap-4 rounded-card border border-border bg-white p-5 shadow-[0_20px_40px_-32px_rgba(16,44,87,0.3)] transition-colors duration-200 hover:shadow-[0_28px_48px_-30px_rgba(16,44,87,0.35)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-input bg-tint text-action">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-compact font-semibold text-navy">{catalog.title}</h3>
                    <p className="text-compact text-slate">
                      {service.description ?? catalog.description}
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-input bg-tint/70 px-3 py-2">
                    <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
                    <p className="min-w-0 break-words text-caption text-slate">
                      <span className="font-semibold text-navy">Tax jurisdictions:</span>{" "}
                      {service.jurisdictionCodes.map(jurisdictionLabel).join(" · ")}
                    </p>
                  </div>

                  <Link
                    href={serviceHref(service.serviceSlug)}
                    className="mt-auto inline-flex items-center gap-1.5 text-compact font-semibold text-action"
                  >
                    Explore {catalog.title}
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
