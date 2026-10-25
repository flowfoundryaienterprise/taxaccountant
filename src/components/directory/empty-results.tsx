import Link from "next/link";
import { SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { activeFilterChips, type CityOption } from "@/lib/directory/filters";
import { clearAllHref } from "@/lib/directory/query-params";
import type { DirectoryFilters } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

interface EmptyResultsProps {
  filters: DirectoryFilters;
  cityOptions: CityOption[];
}

/**
 * DESIGN.md section 9: an empty directory must "state what filters are
 * active, clear filters, suggest nearby supported jurisdictions or contact;
 * never fabricate inventory". So this lists the active filters back rather
 * than just saying "nothing found".
 */
export function EmptyResults({ filters, cityOptions }: EmptyResultsProps) {
  const chips = activeFilterChips(filters, cityOptions);

  return (
    <div className="flex flex-col items-center gap-5 rounded-panel border border-border bg-tint/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-action shadow-[0_12px_24px_-16px_rgba(16,44,87,0.4)]">
        <SearchX className="h-6 w-6" aria-hidden />
      </span>

      <div className="flex max-w-[48ch] flex-col gap-2">
        <h3 className="text-heading-sm font-semibold text-navy">
          No accountants found for these filters.
        </h3>
        <p className="text-compact text-slate">
          Try adjusting your location, service or search preferences.
        </p>
      </div>

      {chips.length ? (
        <div className="flex max-w-[52ch] flex-col gap-2">
          <p className="text-caption font-semibold uppercase tracking-wide text-slate">
            Currently filtering by
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <li
                key={`${chip.key}-${chip.value}`}
                className="rounded-full border border-border bg-white px-3 py-1 text-caption text-navy"
              >
                <span className="text-slate">{chip.groupLabel}:</span> {chip.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={clearAllHref(filters)}
          scroll={false}
          className={cn(buttonVariants({ size: "md" }))}
        >
          Clear filters
        </Link>
        <Link
          href="/#services"
          className={cn(buttonVariants({ variant: "outline", size: "md" }))}
        >
          Explore services
        </Link>
      </div>
    </div>
  );
}
