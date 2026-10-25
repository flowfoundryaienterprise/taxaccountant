import { FilterSkeleton, ResultsSkeleton } from "@/components/directory/results-skeleton";
import { Container } from "@/components/layout/container";

/**
 * Keeps the heading, search panel shell and filter column in place while the
 * route resolves, so only the results area changes — no layout shift between
 * this and the loaded page.
 */
export default function FindAccountantLoading() {
  return (
    <>
      <div className="border-b border-border bg-tint/50">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div aria-hidden className="h-3 w-40 animate-pulse rounded-full bg-white/80" />
          <div className="flex flex-col gap-3">
            <h1 className="max-w-[26ch] text-hero font-semibold text-navy">
              Find the Right Tax Accountant for Your Needs
            </h1>
            <p className="max-w-[70ch] text-lead text-slate">
              Explore tax and accounting professionals by country, tax jurisdiction, specialty and
              language.
            </p>
          </div>
        </div>
      </div>

      <Container className="flex flex-col gap-8 py-8 sm:py-10">
        <div
          aria-hidden
          className="h-[132px] w-full animate-pulse rounded-panel border border-border bg-white sm:h-[124px]"
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <FilterSkeleton />
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div aria-hidden className="h-10 w-full max-w-sm animate-pulse rounded-input bg-tint" />
            <ResultsSkeleton />
          </div>
        </div>
      </Container>
    </>
  );
}
