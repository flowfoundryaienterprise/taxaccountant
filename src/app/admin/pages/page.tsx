import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { demoPages } from "@/lib/admin/admin-fixtures";
import { formatDate, truncate } from "@/lib/admin/admin-formatters";
import {
  CONTENT_STATUSES,
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  statusFilterOptions,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminPageRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Pages" };

const KIND_LABELS: Record<AdminPageRow["kind"], string> = {
  page: "Page",
  guide: "Guide",
  glossary: "Glossary",
};

/**
 * Pages list.
 *
 * The template every other CMS list screen follows: URL-driven search,
 * status filter and pagination through `buildAdminList`, rendered by the
 * shared `AdminDataTable`. Nothing here is a Client Component — the filter
 * bar is a GET form and the filters are links.
 */
export default async function AdminPagesScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const status = readParam(params, "status") || "all";

  const list = buildAdminList<AdminPageRow>({
    rows: demoPages,
    query,
    searchFields: (row) => [row.title, row.slug, row.summary ?? "", KIND_LABELS[row.kind]],
    filterValue: status,
    filterMatch: (row, value) => row.status === value,
    // Most recently touched first, which is what an editor returns for.
    sort: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    page: readPage(params),
  });

  const columns: AdminColumn<AdminPageRow>[] = [
    {
      key: "title",
      header: "Page title",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/admin/pages/${row.id}/edit`}
            className="font-medium text-navy hover:text-action hover:underline"
          >
            {truncate(row.title, 60)}
          </Link>
          {row.summary ? (
            <span className="text-caption text-slate sm:hidden">{truncate(row.summary, 50)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      hideOnMobile: true,
      render: (row) => <code className="font-mono text-caption text-slate">/{row.slug}</code>,
    },
    {
      key: "kind",
      header: "Type",
      hideOnMobile: true,
      render: (row) => KIND_LABELS[row.kind],
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "updated",
      header: "Updated",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono tabular-nums">{formatDate(row.updatedAt) ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/pages/${row.id}/edit`}
          className="text-caption font-medium text-action hover:underline"
        >
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Pages"
        description="Standalone website pages, guides and glossary entries. These map to the contentPages collection."
        actions={
          <Link
            href="/admin/pages/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create page
          </Link>
        }
      />

      <ProvenanceNotice
        provenance="demonstration"
        entity="pages"
        detail="The routes these records describe (/about, /privacy and so on) do not exist on the public site yet."
      />

      <AdminFilterBar
        action="/admin/pages"
        query={query}
        searchLabel="Search pages by title or slug"
        searchPlaceholder="Search pages by title, slug or summary"
        filterOptions={statusFilterOptions(demoPages, (row) => row.status, CONTENT_STATUSES)}
        activeFilter={status}
        resultSummary={resultSummary(list.matched, list.total, "page")}
      />

      <AdminDataTable
        caption="Website pages"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={FileText}
            title={query || status !== "all" ? "No pages match these filters" : "No pages yet"}
            description={
              query || status !== "all"
                ? "Try a different search term, or clear the filters to see every page record."
                : "Page records will appear here once the contentPages collection holds rows."
            }
          />
        }
      />

      <AdminPagination
        action="/admin/pages"
        page={list.page}
        pageCount={list.pageCount}
        total={list.matched}
        pageSize={list.pageSize}
        preserve={{ q: query || undefined, status: status !== "all" ? status : undefined }}
      />

      <ReadOnlyNotice />
    </div>
  );
}
