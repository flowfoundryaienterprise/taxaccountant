import Link from "next/link";
import { X } from "lucide-react";

import { activeFilterChips, type CityOption } from "@/lib/directory/filters";
import {
  buildDirectoryHref,
  clearAllHref,
  DIRECTORY_PATH,
  hasActiveFilters,
} from "@/lib/directory/query-params";
import type { DirectoryFilters } from "@/lib/directory/types";

interface ActiveFiltersProps {
  filters: DirectoryFilters;
  cityOptions: CityOption[];
}

/**
 * Removable chips for every active filter, plus Clear all.
 *
 * Deliberately a Server Component built from real links: each chip is a URL
 * that already has that one value removed, so chips are shareable,
 * middle-clickable and work before any JavaScript loads.
 */
export function ActiveFilters({ filters, cityOptions }: ActiveFiltersProps) {
  if (!hasActiveFilters(filters)) return null;

  const chips = activeFilterChips(filters, cityOptions);

  function hrefWithout(chip: (typeof chips)[number]): string {
    switch (chip.key) {
      case "q":
        return buildDirectoryHref(filters, { q: "" });
      case "mode":
        return buildDirectoryHref(filters, { mode: "either" });
      case "countries":
        return buildDirectoryHref(filters, {
          countries: filters.countries.filter((value) => value !== chip.value),
          cities: [],
        });
      case "cities":
        return buildDirectoryHref(filters, {
          cities: filters.cities.filter((value) => value !== chip.value),
        });
      case "jurisdictions":
        return buildDirectoryHref(filters, {
          jurisdictions: filters.jurisdictions.filter((value) => value !== chip.value),
        });
      case "services":
        return buildDirectoryHref(filters, {
          services: filters.services.filter((value) => value !== chip.value),
        });
      case "languages":
        return buildDirectoryHref(filters, {
          languages: filters.languages.filter((value) => value !== chip.value),
        });
      default:
        return DIRECTORY_PATH;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption font-medium text-slate">Active filters:</span>

      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={`${chip.key}-${chip.value}`}>
            <Link
              href={hrefWithout(chip)}
              scroll={false}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-tint px-3 py-1 text-caption font-medium text-navy transition-all duration-150 hover:border-action hover:bg-white"
            >
              <span className="text-slate">{chip.groupLabel}:</span>
              {chip.label}
              <X
                className="h-3 w-3 text-slate transition-colors duration-150 group-hover:text-danger"
                aria-hidden
              />
              <span className="sr-only">Remove {chip.groupLabel} filter {chip.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={clearAllHref(filters)}
        scroll={false}
        className="text-caption font-semibold text-action underline-offset-4 transition-colors duration-150 hover:text-navy hover:underline"
      >
        Clear all filters
      </Link>
    </div>
  );
}
