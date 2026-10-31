"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { CountryCard, type CountryCardData } from "@/components/countries/country-card";
import { cn } from "@/lib/utils";

interface CountrySearchProps {
  countries: CountryCardData[];
  /** Region order, precomputed on the server so grouping stays stable. */
  regionOrder: string[];
}

/**
 * Client-side country filter.
 *
 * Kept out of the URL on purpose: unlike the directory — where the URL *is*
 * the filter state because the results are shareable, paginated and
 * server-rendered — this is a local narrowing of a short, fully-rendered
 * list. Putting it in the URL would cost a server round-trip per keystroke
 * for no gain in shareability.
 *
 * Matching is case-insensitive across country name, short name, ISO code and
 * region, done in `matchesCountryQuery`'s haystack on the server side of the
 * data and repeated here over the same fields.
 */
export function CountrySearch({ countries, regionOrder }: CountrySearchProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const needle = query.trim().toLowerCase();

  const matches = React.useMemo(() => {
    if (!needle) return countries;
    return countries.filter((country) =>
      [country.name, country.code, country.region].join(" ").toLowerCase().includes(needle),
    );
  }, [countries, needle]);

  const grouped = React.useMemo(() => {
    const buckets = new Map<string, CountryCardData[]>();
    for (const country of matches) {
      const bucket = buckets.get(country.region);
      if (bucket) bucket.push(country);
      else buckets.set(country.region, [country]);
    }

    return regionOrder
      .filter((region) => buckets.has(region))
      .map((region) => ({ region, countries: buckets.get(region) ?? [] }));
  }, [matches, regionOrder]);

  function clear() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <label htmlFor="country-search" className="text-compact font-medium text-navy">
          Search countries
        </label>

        <div className="relative w-full max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <input
            ref={inputRef}
            id="country-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                clear();
              }
            }}
            placeholder="Country name or code — e.g. India or IN"
            autoComplete="off"
            aria-describedby="country-search-status"
            className="h-12 w-full rounded-input border border-control bg-white pl-11 pr-11 text-compact text-navy transition-colors duration-150 placeholder:text-slate/70 hover:border-action/60 focus:border-action focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear country search"
              className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate transition-colors duration-150 hover:bg-tint hover:text-navy"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <p id="country-search-status" aria-live="polite" className="text-caption text-slate">
          {needle
            ? `${matches.length} of ${countries.length} ${
                countries.length === 1 ? "country" : "countries"
              } match “${query.trim()}”`
            : `${countries.length} ${countries.length === 1 ? "country" : "countries"} open for discovery`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-panel border border-border bg-tint/60 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-action">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex max-w-[50ch] flex-col gap-2">
            <h3 className="text-heading-sm font-semibold text-navy">
              No country matches “{query.trim()}”
            </h3>
            <p className="text-compact text-slate">
              Only countries that are open for public discovery are listed here. More are added as
              their jurisdiction and service configuration is approved.
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]",
            )}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {grouped.map((group) => (
            <section key={group.region} className="flex flex-col gap-5">
              <h3 className="text-caption text-slate">
                {group.region}
              </h3>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.countries.map((country) => (
                  <li key={country.code} className="flex">
                    <CountryCard country={country} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
