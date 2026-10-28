import { Container } from "@/components/layout/container";

/**
 * Profile skeleton.
 *
 * Sized like the real page — 4:5 portrait, the same header band, the same
 * two-column body — so nothing jumps when the content arrives (DESIGN.md
 * section 9: "stable skeleton sized like eventual card/table"; section 10:
 * "no layout shift when profile pictures and cards load").
 */
export default function ProfileLoading() {
  return (
    <>
      <div className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-8 py-8 sm:py-12">
          <div aria-hidden className="h-3 w-56 animate-pulse rounded-full bg-white/80" />

          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-12">
            <div
              aria-hidden
              className="mx-auto aspect-[4/5] w-full max-w-[320px] animate-pulse rounded-panel border border-border bg-white lg:mx-0"
            />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div aria-hidden className="h-6 w-64 animate-pulse rounded-full bg-white/80" />
                <div aria-hidden className="h-12 w-full max-w-md animate-pulse rounded-card bg-white/80" />
                <div aria-hidden className="h-5 w-48 animate-pulse rounded-input bg-white/70" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    aria-hidden
                    className="h-5 w-full max-w-[18rem] animate-pulse rounded-input bg-white/70"
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <div aria-hidden className="h-12 w-48 animate-pulse rounded-input bg-white/80" />
                <div aria-hidden className="h-12 w-40 animate-pulse rounded-input bg-white/70" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
        <div className="flex flex-col gap-10">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-4">
              <div aria-hidden className="h-8 w-72 animate-pulse rounded-input bg-tint" />
              <div aria-hidden className="h-24 w-full animate-pulse rounded-card border border-border bg-white" />
            </div>
          ))}
        </div>

        <div aria-hidden className="h-64 w-full animate-pulse rounded-card border border-border bg-white" />
      </Container>

      <span className="sr-only" role="status">
        Loading professional profile
      </span>
    </>
  );
}
