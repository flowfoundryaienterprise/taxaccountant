import type { AdminFilterOption } from "@/components/admin/admin-filter-bar";

/**
 * Search, filter and pagination for CMS list screens.
 *
 * Pure and generic, so every table screen shares one implementation rather
 * than ten near-copies. Mirrors the Day 3 public directory's contract: the
 * URL is the state, unknown values degrade to a valid view instead of an
 * error, and a stale page number clamps rather than 404s.
 *
 * When the authorized Convex queries land, this is the logic that moves
 * server-side into a cursor-paginated query; the screens keep consuming the
 * same `AdminListResult` shape.
 */

export const ADMIN_PAGE_SIZE = 10;

/** Shape a page receives from both Next.js and vinext. */
export type AdminSearchParams = Record<string, string | string[] | undefined>;

export function readParam(params: AdminSearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function readPage(params: AdminSearchParams): number {
  const parsed = Number.parseInt(readParam(params, "page"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export interface AdminListResult<Row> {
  rows: Row[];
  total: number;
  matched: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

interface BuildListOptions<Row> {
  rows: Row[];
  query: string;
  /** Fields searched for the keyword, lowercased by the caller's selector. */
  searchFields: (row: Row) => string[];
  /** Active filter value; `all` disables filtering. */
  filterValue?: string;
  filterMatch?: (row: Row, value: string) => boolean;
  /** Stable ordering applied before pagination. */
  sort?: (a: Row, b: Row) => number;
  page: number;
  pageSize?: number;
}

export function buildAdminList<Row>({
  rows,
  query,
  searchFields,
  filterValue = "all",
  filterMatch,
  sort,
  page,
  pageSize = ADMIN_PAGE_SIZE,
}: BuildListOptions<Row>): AdminListResult<Row> {
  const needle = query.trim().toLowerCase();

  let matchedRows = rows.filter((row) => {
    if (needle) {
      const haystack = searchFields(row).join(" ").toLowerCase();
      // Every whitespace-separated term must appear, same as the public
      // directory's keyword rule.
      if (!needle.split(/\s+/).every((term) => haystack.includes(term))) return false;
    }

    if (filterValue !== "all" && filterMatch && !filterMatch(row, filterValue)) return false;

    return true;
  });

  if (sort) matchedRows = [...matchedRows].sort(sort);

  const matched = matchedRows.length;
  const pageCount = Math.max(1, Math.ceil(matched / pageSize));
  // Clamp rather than 404 — a stale `?page=9` shows the last page.
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = (current - 1) * pageSize;

  return {
    rows: matchedRows.slice(start, start + pageSize),
    total: rows.length,
    matched,
    page: current,
    pageCount,
    pageSize,
  };
}

/**
 * Builds status filter chips with live counts, so an editor can see how many
 * records sit in each state before choosing.
 */
export function statusFilterOptions<Row>(
  rows: Row[],
  statusOf: (row: Row) => string,
  statuses: { value: string; label: string }[],
): AdminFilterOption[] {
  return [
    { value: "all", label: "All", count: rows.length },
    ...statuses.map((status) => ({
      ...status,
      count: rows.filter((row) => statusOf(row) === status.value).length,
    })),
  ];
}

/**
 * "12 of 34 pages match" / "34 pages" — one wording for every screen.
 *
 * The noun agrees with `total`, not with `matched`: the phrase describes the
 * collection being filtered, so "1 of 18 listings match" is correct and
 * "1 of 18 listing match" is not.
 */
export function resultSummary(matched: number, total: number, noun: string): string {
  const collection = total === 1 ? noun : `${noun}s`;
  return matched === total
    ? `${total} ${collection}`
    : `${matched} of ${total} ${collection} match`;
}

export const CONTENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
