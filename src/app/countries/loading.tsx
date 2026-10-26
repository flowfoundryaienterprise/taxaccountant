import { Container } from "@/components/layout/container";

/**
 * Holds the hero band, the search field and the card grid's shape while the
 * route resolves. Applies to `/countries` and, by nesting, to every
 * `/countries/[countryCode]` page.
 */
export default function CountriesLoading() {
  return (
    <>
      <div className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-8 py-10 sm:py-14">
          <div aria-hidden className="h-3 w-40 animate-pulse rounded-full bg-white/80" />
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="flex flex-col gap-5">
              <div aria-hidden className="h-12 w-full max-w-xl animate-pulse rounded-card bg-white/80" />
              <div aria-hidden className="h-6 w-full max-w-lg animate-pulse rounded-input bg-white/70" />
              <div aria-hidden className="h-11 w-56 animate-pulse rounded-input bg-white/80" />
            </div>
            <div aria-hidden className="aspect-[2/1] w-full animate-pulse rounded-panel bg-white" />
          </div>
        </Container>
      </div>

      <Container className="flex flex-col gap-10 py-16">
        <div aria-hidden className="h-8 w-64 animate-pulse rounded-input bg-tint" />
        <div aria-hidden className="h-12 w-full max-w-xl animate-pulse rounded-input border border-border bg-white" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              aria-hidden
              className="h-48 animate-pulse rounded-card border border-border bg-white"
            />
          ))}
        </div>
      </Container>

      <span className="sr-only" role="status">
        Loading countries
      </span>
    </>
  );
}
