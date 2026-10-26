import { Layers } from "lucide-react";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import type { CountryEntry } from "@/lib/marketplace/countries";
import { directoryHref } from "@/lib/marketplace/query-params";
import type { ServiceCatalogEntry } from "@/lib/marketplace/services";

interface CountryServicesProps {
  country: CountryEntry;
  services: ServiceCatalogEntry[];
}

/**
 * Service categories genuinely represented for this country.
 *
 * The list is derived in `servicesForCountry` from professionals actually
 * present in the dataset — a category a country has nobody for simply does
 * not appear, and the empty state says so rather than printing the full
 * catalogue as if it were coverage.
 *
 * Each card goes to the directory pre-filtered on **country + service**,
 * not to the generic service page, because the claim being made here is
 * "this combination exists" and the directory is where that can be checked.
 */
export function CountryServices({ country, services }: CountryServicesProps) {
  return (
    <section id="services" className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Service categories"
          title={`Services represented in ${country.name}`}
          description="Only categories currently represented by professionals in this country are listed. Availability of any individual service is agreed with the professional you contact."
        />

        {services.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={`No service categories are configured for ${country.name} yet`}
            description="Nothing is listed rather than listing categories nobody covers here. You can still search the whole directory, or filter by the tax jurisdiction you need."
            actions={[
              { label: "Open the directory", href: directoryHref({ country: country.code }) },
              { label: "Browse all services", href: "/services", variant: "outline" },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ServiceCard
                key={service.slug}
                service={service}
                href={directoryHref({ country: country.code, service: service.slug })}
                ctaLabel={`Find in ${country.shortName ?? country.name}`}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
