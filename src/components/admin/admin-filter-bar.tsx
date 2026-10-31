import Link from "next/link";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdminFilterBarProps {
  /** Route this bar submits to, e.g. `/admin/pages`. */
  action: string;
  /** Current `?q=`, used to seed the input. */
  query: string;
  searchLabel: string;
  searchPlaceholder: string;
  /** Status (or equivalent) filter rendered as links, so state lives in the URL. */
  filterName?: string;
  filterLabel?: string;
  filterOptions?: AdminFilterOption[];
  activeFilter?: string;
  /** Extra params to preserve when a filter link is followed. */
  preserve?: Record<string, string | undefined>;
  resultSummary: string;
}

/**
 * Search and filter controls for a CMS list screen.
 *
 * State lives entirely in the URL — the search is a plain GET form and each
 * filter is a link — which is the same contract the Day 3 public directory
 * uses. It means refresh, back/forward and a shared link all behave, with
 * no client state and no `"use client"` on this component at all.
 */
export function AdminFilterBar({
  action,
  query,
  searchLabel,
  searchPlaceholder,
  filterName = "status",
  filterLabel = "Status",
  filterOptions = [],
  activeFilter = "all",
  preserve = {},
  resultSummary,
}: AdminFilterBarProps) {
  const buildHref = (value: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    for (const [key, entry] of Object.entries(preserve)) {
      if (entry) params.set(key, entry);
    }
    if (value !== "all") params.set(filterName, value);
    const search = params.toString();
    return search ? `${action}?${search}` : action;
  };

  const hasActive = Boolean(query) || activeFilter !== "all";

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-4">
      <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={`${filterName}-search`} className="sr-only">
          {searchLabel}
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <input
            id={`${filterName}-search`}
            type="search"
            name="q"
            defaultValue={query}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-input border border-control bg-white pr-3 pl-9 text-compact text-navy placeholder:text-slate focus-visible:border-action"
          />
        </div>

        {/* Keeps the active filter when a new search is submitted. */}
        {activeFilter !== "all" ? (
          <input type="hidden" name={filterName} value={activeFilter} />
        ) : null}
        {Object.entries(preserve).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null,
        )}

        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"
        >
          Search
        </button>
      </form>

      {filterOptions.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-medium text-slate">{filterLabel}:</span>
          {filterOptions.map((option) => {
            const isActive = option.value === activeFilter;
            return (
              <Link
                key={option.value}
                href={buildHref(option.value)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium transition-colors duration-150",
                  isActive
                    ? "border-action bg-action text-white"
                    : "border-border bg-white text-slate hover:bg-subtle",
                )}
              >
                {option.label}
                {option.count !== undefined ? (
                  <span className={cn("tabular-nums", isActive ? "text-white/80" : "text-slate")}>
                    ({option.count})
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-caption text-slate">
          {resultSummary}
        </p>

        {hasActive ? (
          <Link
            href={action}
            className="inline-flex items-center gap-1 text-caption font-medium text-action hover:underline"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
