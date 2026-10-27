import { cn } from "@/lib/utils";

/**
 * Loading placeholders sized like the real CMS furniture, so a route
 * transition does not reflow the page (DESIGN.md section 9).
 */

export function AdminSkeletonBar({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-input bg-tint", className)} />;
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <AdminSkeletonBar className="h-8 w-64" />
        <AdminSkeletonBar className="h-4 w-full max-w-xl" />
      </div>

      <AdminSkeletonBar className="h-28 w-full rounded-card" />

      <div className="overflow-hidden rounded-card border border-border bg-white">
        <AdminSkeletonBar className="h-11 w-full rounded-none" />
        <div className="flex flex-col gap-px">
          {Array.from({ length: rows }).map((_, index) => (
            <AdminSkeletonBar key={index} className="h-14 w-full rounded-none opacity-60" />
          ))}
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading content
      </span>
    </div>
  );
}
