import { FolderOpen } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { ServiceCard } from "@/components/shared/service-card";
import type { ServiceCatalogEntry } from "@/lib/marketplace/services";
import { cn } from "@/lib/utils";

interface ServiceGridProps {
  services: ServiceCatalogEntry[];
  /** Grid density. Four across on the index, three on narrower sections. */
  columns?: 3 | 4;
  /** Set false inside already-animated sections to avoid stacked reveals. */
  animate?: boolean;
  className?: string;
}

export function ServiceGrid({
  services,
  columns = 4,
  animate = true,
  className,
}: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No services are configured yet"
        description="Service categories are published from the taxonomy. None are available to show here right now."
        actions={[{ label: "Find an Accountant", href: "/find-accountant", variant: "outline" }]}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {services.map((service, index) =>
        animate ? (
          <Reveal key={service.slug} delayMs={index * 60} className="h-full">
            <ServiceCard service={service} />
          </Reveal>
        ) : (
          <ServiceCard key={service.slug} service={service} />
        ),
      )}
    </div>
  );
}
