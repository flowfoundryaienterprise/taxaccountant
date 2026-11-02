import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  action: string;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  /** Query params to carry across page links (search, filters). */
  preserve?: Record<string, string | undefined>;
}

/**
 * Page links for a CMS table.
 *
 * Links, not buttons, so pagination is shareable and survives refresh and
 * back/forward — the same URL-as-state contract the rest of the CMS uses.
 */
export function AdminPagination({
  action,
  page,
  pageCount,
  total,
  pageSize,
  preserve = {},
}: AdminPaginationProps) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(preserve)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const search = params.toString();
    return search ? `${action}?${search}` : action;
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const linkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-input border border-control bg-white px-3 text-compact font-medium text-navy transition-[background-color,transform] duration-150 hover:bg-subtle active:scale-[0.97]";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border bg-white px-5 py-4"
    >
      <p className="text-caption text-slate">
        Showing <span className="font-semibold text-navy">{first}</span>–
        <span className="font-semibold text-navy">{last}</span> of{" "}
        <span className="font-semibold text-navy">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className={linkClass}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Link>
        ) : (
          <span aria-disabled className={cn(linkClass, "cursor-not-allowed opacity-50")}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </span>
        )}

        <span className="px-1 text-caption text-slate">
          Page {page} of {pageCount}
        </span>

        {page < pageCount ? (
          <Link href={href(page + 1)} rel="next" className={linkClass}>
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span aria-disabled className={cn(linkClass, "cursor-not-allowed opacity-50")}>
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
