import * as React from "react";

import { cn } from "@/lib/utils";

export interface AdminColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
  /** Hide below `sm`, for columns that are context rather than identity. */
  hideOnMobile?: boolean;
  /** Right-align, used for the actions column. */
  align?: "left" | "right";
  width?: string;
}

interface AdminDataTableProps<Row> {
  caption: string;
  columns: AdminColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Rendered in place of the table when `rows` is empty. */
  empty: React.ReactNode;
  className?: string;
}

/**
 * The one table in the CMS.
 *
 * Every management screen renders through this rather than hand-rolling its
 * own `<table>`, so header styling, the scroll container, the caption and
 * the empty state behave identically everywhere (Day 6 brief section 15:
 * "Prefer reusable components rather than repeating similar tables").
 *
 * Accessibility and overflow notes:
 *  - A real `<caption>`, visually hidden, names the table for screen
 *    readers — several screens show more than one.
 *  - `scope="col"` on headers, and the first column is the row's identity.
 *  - The scroll container is `overflow-x-auto` with `tabIndex={0}` so a
 *    keyboard user can actually reach and scroll a wide table, which is the
 *    part usually missed. `role="region"` plus the label makes it a
 *    navigable landmark rather than an anonymous scroll box.
 *  - Columns marked `hideOnMobile` drop below `sm`; identity and status
 *    never do, so a narrow screen still answers "what is this and what
 *    state is it in".
 */
export function AdminDataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  empty,
  className,
}: AdminDataTableProps<Row>) {
  if (rows.length === 0) return <>{empty}</>;

  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        "w-full overflow-x-auto rounded-card border border-border bg-white shadow-[0_1px_2px_rgba(16,44,87,0.04)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-focus)]",
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>

        <thead>
          <tr className="border-b border-border bg-canvas">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  /*
                   * Sentence case. These were 12px semibold uppercase with
                   * wide tracking — the hardest text in the CMS to read,
                   * on the row that tells you what every column means.
                   */
                  "px-4 py-3 text-caption font-medium text-slate",
                  column.align === "right" && "text-right",
                  column.hideOnMobile && "hidden sm:table-cell",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border border-l-2 border-l-transparent last:border-b-0 transition-[background-color,border-color] duration-150 hover:border-l-action hover:bg-subtle"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 align-top text-compact text-slate",
                    column.align === "right" && "text-right",
                    column.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
