import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";

import { CountryBadge } from "@/components/countries/country-badge";
import { countryHref } from "@/lib/marketplace/query-params";

/**
 * Plain, serializable shape for a country card.
 *
 * Deliberately string/number only: the card is rendered inside the client
 * search component, so nothing here may carry a React component or a
 * function across the boundary. Everything is precomputed on the server from
 * `@/lib/marketplace/countries`.
 *
 * Note what is absent — there is no professional count, no "experts"
 * figure and no coverage claim. The brief forbids inventing country-specific
 * professional numbers, and no professionals are published yet.
 */
export interface CountryCardData {
  code: string;
  name: string;
  region: string;
  /** Service categories genuinely represented for this country. */
  serviceTitles: string[];
  /** How many tax jurisdictions exist for the country in the taxonomy. */
  jurisdictionCount: number;
}

const MAX_SERVICE_CHIPS = 3;

export function CountryCard({ country }: { country: CountryCardData }) {
  const shown = country.serviceTitles.slice(0, MAX_SERVICE_CHIPS);
  const remaining = country.serviceTitles.length - shown.length;

  return (
    <Link
      href={countryHref(country.code)}
      className="group flex h-full flex-col gap-4 rounded-card border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-action hover:shadow-[0_20px_36px_-26px_rgba(16,44,87,0.3)] focus-visible:border-action"
    >
      <div className="flex items-center gap-3">
        <CountryBadge code={country.code} countryName={country.name} />
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-compact font-semibold text-navy">{country.name}</h3>
          <p className="text-caption text-slate">{country.region}</p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-caption text-slate">
        <Scale className="h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
        {country.jurisdictionCount}{" "}
        {country.jurisdictionCount === 1 ? "tax jurisdiction" : "tax jurisdictions"} listed
      </p>

      {shown.length ? (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((title) => (
            <span
              key={title}
              className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy"
            >
              {title}
            </span>
          ))}
          {remaining > 0 ? (
            <span className="rounded-full border border-border px-2.5 py-1 text-caption text-slate">
              +{remaining} more
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-caption text-slate">
          No service categories are configured for this country yet.
        </p>
      )}

      <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-compact font-medium text-action">
        Explore country
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
