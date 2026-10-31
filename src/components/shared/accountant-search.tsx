"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildDirectoryHref, EMPTY_FILTERS } from "@/lib/directory/query-params";
import { countryCodes, serviceSlugs } from "@/lib/directory/taxonomy";
import { searchCountries, services } from "@/lib/home-content";

/**
 * Homepage hero search. Captures country + service and hands them to the
 * directory at `/find-accountant` (DESIGN.md "Search should not reset
 * filters... shareable URL loads").
 *
 * The URL is built with the directory's own `buildDirectoryHref`, so the two
 * entry points cannot drift on param names or encoding. Visual design is
 * unchanged from Day 2.
 */
export function AccountantSearch() {
  const router = useRouter();
  const [country, setCountry] = React.useState("");
  const [service, setService] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function navigate(params: { country?: string; service?: string }) {
    // Validate against the shared vocabularies before navigating, so a
    // tampered or stale option value can never reach the directory URL.
    const validCountry = params.country && countryCodes.has(params.country) ? params.country : "";
    const validService = params.service && serviceSlugs.has(params.service) ? params.service : "";

    router.push(
      buildDirectoryHref(EMPTY_FILTERS, {
        countries: validCountry ? [validCountry] : [],
        services: validService ? [validService] : [],
      }),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!country && !service) {
      setError("Choose at least a country or a service to search.");
      return;
    }
    setError(null);
    navigate({ country, service });
  }

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-white p-5 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.25)] sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="search-country" className="text-caption font-medium text-slate">
            Country
          </label>
          <select
            id="search-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Select country or city</option>
            {searchCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="search-service" className="text-caption font-medium text-slate">
            Service
          </label>
          <select
            id="search-service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">What service do you need?</option>
            {services.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="transition-colors duration-150 active:scale-[0.98] sm:w-auto"
        >
          <Search className="h-4 w-4" aria-hidden />
          Find an Accountant
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption text-slate">Popular:</span>
        {services.slice(0, 6).map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => navigate({ service: item.slug })}
            className="rounded-full border border-control px-3 py-1 text-caption font-medium text-navy transition-colors duration-150 hover:border-action hover:bg-tint"
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
