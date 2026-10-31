import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildDirectoryHref } from "@/lib/directory/query-params";
import type { DirectoryFilters, DirectoryResults } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

interface DirectoryPaginationProps {
  filters: DirectoryFilters;
  results: DirectoryResults;
}

const linkBase =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-input border px-3 text-compact font-medium transition-colors duration-150";

/**
 * Page links, not buttons — every page is a real shareable URL and
 * back/forward moves between pages (DESIGN.md section 5: Pagination must
 * "preserve filters, shareable URLs and focus position after transition").
 *
 * Window of page numbers around the current page keeps the control usable at
 * 375px without horizontal scrolling.
 */
function pageWindow(page: number, pageCount: number): number[] {
  const span = 1;
  const pages = new Set<number>([1, pageCount]);
  for (let candidate = page - span; candidate <= page + span; candidate += 1) {
    if (candidate >= 1 && candidate <= pageCount) pages.add(candidate);
  }
  return [...pages].sort((a, b) => a - b);
}

export function DirectoryPagination({ filters, results }: DirectoryPaginationProps) {
  if (results.pageCount <= 1) return null;

  const { page, pageCount } = results;
  const pages = pageWindow(page, pageCount);

  return (
    <nav aria-label="Directory pagination" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={buildDirectoryHref(filters, { page: page - 1 })}
          scroll={false}
          rel="prev"
          className={cn(linkBase, "border-control bg-white text-navy hover:border-action hover:bg-tint")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(linkBase, "cursor-not-allowed border-control bg-white text-slate/50")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </span>
      )}

      <ul className="flex items-center gap-1.5">
        {pages.map((candidate, index) => {
          const previous = pages[index - 1];
          const gap = previous !== undefined && candidate - previous > 1;

          return (
            <li key={candidate} className="flex items-center gap-1.5">
              {gap ? (
                <span aria-hidden className="px-1 text-compact text-slate">
                  …
                </span>
              ) : null}
              {candidate === page ? (
                <span
                  aria-current="page"
                  className={cn(linkBase, "border-action bg-action text-white")}
                >
                  {candidate}
                </span>
              ) : (
                <Link
                  href={buildDirectoryHref(filters, { page: candidate })}
                  scroll={false}
                  aria-label={`Go to page ${candidate}`}
                  className={cn(
                    linkBase,
                    "border-control bg-white text-navy hover:border-action hover:bg-tint",
                  )}
                >
                  {candidate}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {page < pageCount ? (
        <Link
          href={buildDirectoryHref(filters, { page: page + 1 })}
          scroll={false}
          rel="next"
          className={cn(linkBase, "border-control bg-white text-navy hover:border-action hover:bg-tint")}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(linkBase, "cursor-not-allowed border-control bg-white text-slate/50")}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}

      <p className="w-full text-center text-caption text-slate">
        Page {page} of {pageCount}
      </p>
    </nav>
  );
}
