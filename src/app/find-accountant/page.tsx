import type { Metadata } from "next";

import { AccountantSearchBar } from "@/components/directory/accountant-search-bar";
import { ActiveFilters } from "@/components/directory/active-filters";
import { DirectoryHeader } from "@/components/directory/directory-header";
import { DirectoryPagination } from "@/components/directory/directory-pagination";
import { EmptyResults } from "@/components/directory/empty-results";
import { FilterSidebar } from "@/components/directory/filter-sidebar";
import { MobileFilterDrawer } from "@/components/directory/mobile-filter-drawer";
import { ProfessionalResults } from "@/components/directory/professional-results";
import { SortDropdown } from "@/components/directory/sort-dropdown";
import { Container } from "@/components/layout/container";
import { allCityTokens, availableCities, searchDirectory } from "@/lib/directory/filters";
import { loadDirectory } from "@/lib/directory/public-directory";
import {
  parseDirectoryFilters,
  type RawSearchParams,
  searchBarKey,
  toDirectorySearchParams,
} from "@/lib/directory/query-params";

export const metadata: Metadata = {
  title: "Find a Tax Accountant",
  description:
    "Explore tax and accounting professionals by country, tax jurisdiction, specialty and language.",
  alternates: { canonical: "/find-accountant" },
  openGraph: {
    title: "Find the Right Tax Accountant for Your Needs",
    description:
      "Explore tax and accounting professionals by country, tax jurisdiction, specialty and language.",
    url: "/find-accountant",
    type: "website",
  },
  // Keep the directory out of search indexes until the 100-profile cap is removed.
  robots: { index: false, follow: true },
};

interface FindAccountantPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function FindAccountantPage({ searchParams }: FindAccountantPageProps) {
  const raw = await searchParams;
  let directory: Awaited<ReturnType<typeof loadDirectory>>;
  try {
    directory = await loadDirectory();
  } catch {
    return <Container className="py-16"><div role="alert" className="rounded-card border border-border bg-white p-8"><h1 className="text-heading-sm font-semibold text-navy">Directory unavailable</h1><p className="mt-3 text-slate">Professional listings could not be loaded. Please try again shortly.</p><a href="/find-accountant" className="mt-4 inline-block text-action underline">Retry search</a></div></Container>;
  }
  const listings = directory.items;

  // City tokens are validated against the data, so a stale or hand-edited
  // `?city=` value is dropped instead of silently returning zero results.
  const filters = parseDirectoryFilters(raw, allCityTokens(listings));

  const results = searchDirectory(listings, filters);
  const cityOptions = availableCities(listings, filters.countries);
  const allCityOptions = availableCities(listings, []);

  // Serialized once and handed to every card, so a profile opened from
  // these results can offer a "Back to Search Results" link that restores
  // exactly this search.
  const returnTo = toDirectorySearchParams(filters).toString();

  const firstOnPage = results.total === 0 ? 0 : (results.page - 1) * results.pageSize + 1;
  const lastOnPage = Math.min(results.page * results.pageSize, results.total);

  return (
    <>
      <DirectoryHeader resultCount={listings.length} preview={directory.preview} />

      <Container className="flex flex-col gap-8 py-10 sm:py-12">
        {directory.limited ? <p role="status" className="rounded-card border border-warning/30 bg-white p-4 text-compact text-slate">This directory currently shows only the first 100 approved profiles. Search counts and filters apply to those profiles only.</p> : null}
        <AccountantSearchBar key={searchBarKey(filters)} filters={filters} />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <FilterSidebar filters={filters} cityOptions={cityOptions} />

          <section aria-label="Search results" className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <MobileFilterDrawer
                filters={filters}
                allCityOptions={allCityOptions}
                resultCount={results.total}
              />

              <p aria-live="polite" className="text-compact text-slate">
                {results.total === 0 ? (
                  "No professionals match these filters"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-navy">
                      {firstOnPage}–{lastOnPage}
                    </span>{" "}
                    of <span className="font-semibold text-navy">{results.total}</span>{" "}
                    {results.total === 1 ? "professional" : "professionals"}
                  </>
                )}
              </p>

              <SortDropdown filters={filters} />
            </div>

            <ActiveFilters filters={filters} cityOptions={allCityOptions} />

            {results.total === 0 ? (
              <EmptyResults filters={filters} cityOptions={allCityOptions} />
            ) : (
              <>
                <ProfessionalResults results={results} returnTo={returnTo} />
                <DirectoryPagination filters={filters} results={results} />
              </>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
