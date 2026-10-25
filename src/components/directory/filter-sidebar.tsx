"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { FilterPanel } from "@/components/directory/filter-panel";
import type { CityOption } from "@/lib/directory/filters";
import { buildDirectoryHref, clearAllHref, hasActiveFilters } from "@/lib/directory/query-params";
import type { DirectoryFilters } from "@/lib/directory/types";

interface FilterSidebarProps {
  filters: DirectoryFilters;
  cityOptions: CityOption[];
}

/**
 * Desktop filters. Each change is committed straight to the URL, which is
 * the only filter store — so refresh, deep links and browser back/forward
 * all stay correct, and `buildDirectoryHref` resets pagination for us.
 */
export function FilterSidebar({ filters, cityOptions }: FilterSidebarProps) {
  const router = useRouter();

  function handleChange(patch: Partial<DirectoryFilters>) {
    router.push(buildDirectoryHref(filters, patch), { scroll: false });
  }

  return (
    <aside
      aria-labelledby="directory-filters-heading"
      className="hidden w-[280px] shrink-0 lg:block"
    >
      <div className="sticky top-24 rounded-panel border border-border bg-white p-5 shadow-[0_20px_40px_-32px_rgba(16,44,87,0.25)]">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <h2
            id="directory-filters-heading"
            className="flex items-center gap-2 text-compact font-semibold text-navy"
          >
            <SlidersHorizontal className="h-4 w-4 text-action" aria-hidden />
            Filters
          </h2>
          {hasActiveFilters(filters) ? (
            <button
              type="button"
              onClick={() => router.push(clearAllHref(filters), { scroll: false })}
              className="text-caption font-semibold text-action transition-colors duration-150 hover:text-navy"
            >
              Clear all
            </button>
          ) : null}
        </div>

        <FilterPanel
          filters={filters}
          cityOptions={cityOptions}
          idPrefix="desktop"
          onChange={handleChange}
        />
      </div>
    </aside>
  );
}
