"use client";

import { useRouter } from "next/navigation";

import { buildDirectoryHref } from "@/lib/directory/query-params";
import { sortOptions } from "@/lib/directory/taxonomy";
import type { DirectoryFilters, DirectorySort } from "@/lib/directory/types";

interface SortDropdownProps {
  filters: DirectoryFilters;
}

/**
 * Only orderings the data can actually support: display name ascending or
 * descending, and newest first. No "highest rated", "lowest price" or "most
 * reviewed" — those attributes do not exist yet (API.md section 2: "sorting
 * and filters need actual supported data").
 */
export function SortDropdown({ filters }: SortDropdownProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="directory-sort" className="whitespace-nowrap text-caption font-medium text-slate">
        Sort by
      </label>
      <select
        id="directory-sort"
        value={filters.sort}
        onChange={(event) =>
          router.push(
            buildDirectoryHref(filters, { sort: event.target.value as DirectorySort }),
            { scroll: false },
          )
        }
        className="h-10 rounded-input border border-border bg-white px-3 text-compact font-medium text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
