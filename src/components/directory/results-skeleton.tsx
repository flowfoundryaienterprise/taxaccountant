/**
 * Card-shaped skeletons sized like the real `ProfessionalCard` (4:5 image,
 * same radius, same padding) so the grid does not shift when results
 * arrive — DESIGN.md section 9: "stable skeleton sized like eventual
 * card/table".
 */
export function ResultsSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <span className="sr-only">Loading professionals…</span>

      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-[0_20px_40px_-28px_rgba(16,44,87,0.25)]"
        >
          <div className="aspect-[4/5] w-full animate-pulse bg-tint" />
          <div className="flex flex-col gap-3 p-5">
            <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-tint" />
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-tint" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-tint" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-tint" />
            <div className="flex gap-1.5">
              <div className="h-6 w-20 animate-pulse rounded-full bg-tint" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-tint" />
            </div>
            <div className="mt-1 h-10 w-full animate-pulse rounded-input bg-tint" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Keeps the desktop filter column from collapsing while results load. */
export function FilterSkeleton() {
  return (
    <div
      aria-hidden
      className="hidden w-[280px] shrink-0 lg:block"
    >
      <div className="rounded-panel border border-border bg-white p-5">
        <div className="h-4 w-24 animate-pulse rounded-full bg-tint" />
        <div className="mt-6 flex flex-col gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-tint" />
              <div className="h-3 w-full animate-pulse rounded-full bg-tint" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-tint" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
