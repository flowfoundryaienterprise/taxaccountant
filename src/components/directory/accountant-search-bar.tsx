"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildDirectoryHref, MAX_QUERY_LENGTH } from "@/lib/directory/query-params";
import { countryOptions, serviceOptions } from "@/lib/directory/taxonomy";
import type { DirectoryFilters } from "@/lib/directory/types";

/**
 * The directory search bar: keyword, country and service, matching the Day 2
 * homepage hero controls (`@/components/shared/accountant-search`) and
 * writing the same query params.
 *
 * Inputs are seeded from the committed URL filters, so a refresh, a shared
 * link or a browser Back all restore exactly what the URL says (brief
 * section 4: "Search inputs must preserve their state after page refresh").
 * Re-seeding is handled by the page keying this component on the committed
 * search values — a URL change remounts it with fresh initial state, which
 * avoids a setState-in-effect sync loop entirely.
 *
 * Country and service are single selects here while the sidebar allows
 * several; when more than one is active the select shows an explicit
 * "Several selected" state rather than silently misreporting the filter.
 */

const SEVERAL = "__several";

interface AccountantSearchBarProps {
  filters: DirectoryFilters;
}

function selectValue(selected: string[]): string {
  if (selected.length === 0) return "";
  if (selected.length === 1) return selected[0];
  return SEVERAL;
}

export function AccountantSearchBar({ filters }: AccountantSearchBarProps) {
  const router = useRouter();

  const [keyword, setKeyword] = React.useState(filters.q);
  const [country, setCountry] = React.useState(() => selectValue(filters.countries));
  const [service, setService] = React.useState(() => selectValue(filters.services));

  function commit(next: { keyword: string; country: string; service: string }) {
    const patch: Partial<DirectoryFilters> = { q: next.keyword.trim() };

    // Leave a multi-selection from the sidebar untouched.
    if (next.country !== SEVERAL) {
      patch.countries = next.country ? [next.country] : [];
      patch.cities = [];
    }
    if (next.service !== SEVERAL) {
      patch.services = next.service ? [next.service] : [];
    }

    router.push(buildDirectoryHref(filters, patch), { scroll: false });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit({ keyword, country, service });
  }

  function handleClear() {
    setKeyword("");
    setCountry("");
    setService("");
    commit({ keyword: "", country: "", service: "" });
  }

  const isDirty = Boolean(filters.q || filters.countries.length || filters.services.length);

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search tax and accounting professionals"
      className="flex flex-col gap-4 rounded-panel border border-border bg-white p-5 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.25)] sm:p-6"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="directory-keyword" className="text-caption font-medium text-slate">
            Keyword
          </label>
          <input
            id="directory-keyword"
            type="search"
            value={keyword}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Name, firm, city or specialty"
            className="h-11 rounded-input border border-border bg-white px-3 text-compact text-navy transition-colors duration-150 placeholder:text-slate/70 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="directory-country" className="text-caption font-medium text-slate">
            Country
          </label>
          <select
            id="directory-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-11 rounded-input border border-border bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Any country</option>
            {filters.countries.length > 1 ? (
              <option value={SEVERAL}>Several selected ({filters.countries.length})</option>
            ) : null}
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="directory-service" className="text-caption font-medium text-slate">
            Service
          </label>
          <select
            id="directory-service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            className="h-11 rounded-input border border-border bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Any service</option>
            {filters.services.length > 1 ? (
              <option value={SEVERAL}>Several selected ({filters.services.length})</option>
            ) : null}
            {serviceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            size="lg"
            className="flex-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgba(7,110,212,0.6)] active:translate-y-0 active:scale-[0.98] lg:flex-none"
          >
            <Search className="h-4 w-4" aria-hidden />
            Search
          </Button>
          {isDirty ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={handleClear}
              aria-label="Clear search keyword, country and service"
            >
              <X className="h-4 w-4" aria-hidden />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-caption text-slate">
        Tax jurisdiction, language and consultation mode are filtered separately — a professional
        based in one country is not automatically authorized to advise on another.
      </p>
    </form>
  );
}
