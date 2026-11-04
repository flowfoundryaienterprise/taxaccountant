"use client";

import * as React from "react";
import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import type { AdminProfessionalRow } from "@/lib/admin/admin-types";
import { countryName } from "@/lib/admin/admin-data";
import { cn } from "@/lib/utils";

type Tab = "review" | "published" | "draft";

const TABS: { key: Tab; label: string }[] = [
  { key: "review", label: "Pending" },
  { key: "published", label: "Approved" },
  { key: "draft", label: "Needs changes" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Overview "Professional applications" review queue: tabbed by listing
 * status, with the real counts each tab actually holds (never an invented
 * total). Client-side filter only — the rows themselves are fetched once by
 * the server component and handed down, matching the pattern every other
 * tabbed CMS table on this screen already uses.
 */
export function AdminApplicationsPanel({ rows }: { rows: AdminProfessionalRow[] }) {
  const [tab, setTab] = React.useState<Tab>("review");

  const counts: Record<Tab, number> = {
    review: rows.filter((row) => row.status === "review").length,
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
  };

  const visible = rows.filter((row) => row.status === tab).slice(0, 6);

  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-compact font-semibold text-navy">Professional applications</h2>
          <p className="text-caption text-slate">Review profiles before publishing.</p>
        </div>
        <Link
          href="/admin/professionals"
          className="text-compact font-medium text-action hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-input bg-subtle p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-[0.4rem] px-3 py-1.5 text-caption font-medium transition-colors duration-150",
              tab === key ? "bg-navy text-white" : "text-slate hover:text-navy",
            )}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-slate">
              <th className="py-2 pr-3 font-medium">Professional</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Country</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pl-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-caption font-semibold text-action">
                      {initials(row.displayName)}
                    </span>
                    <span className="font-medium text-navy">{row.displayName}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-compact text-slate">{row.designation ?? "—"}</td>
                <td className="py-3 pr-3 text-compact text-slate">{countryName(row.countryCode)}</td>
                <td className="py-3 pr-3">
                  <AdminStatusBadge status={row.status} />
                </td>
                <td className="py-3 pl-3 text-right">
                  <Link
                    href={`/admin/professionals/${row.id}`}
                    className="inline-flex h-8 items-center rounded-input border border-border px-3 text-caption font-medium text-navy hover:bg-subtle"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-compact text-slate">
                  No profiles in this state.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
