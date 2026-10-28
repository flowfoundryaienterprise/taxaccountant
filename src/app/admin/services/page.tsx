import type { Metadata } from "next";
import Link from "next/link";
import { Folder, Plus } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { adminServices } from "@/lib/admin/admin-data";
import { truncate } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  statusFilterOptions,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminServiceRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Services" };

const SERVICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

/**
 * Service category management.
 *
 * Rows are the live `serviceCatalog` — the same eight categories the
 * homepage grid, `/services`, `/services/[slug]`, the nav menus and the
 * directory's `?service=` filter all use. Nothing is duplicated here and no
 * slug is altered: a canonical slug change would break existing links,
 * bookmarks and filter URLs, and needs a migration plan rather than an edit
 * field (brief section 7).
 */
export default async function AdminServicesScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const status = readParam(params, "status") || "all";
  const services = adminServices();

  const list = buildAdminList<AdminServiceRow>({
    rows: services,
    query,
    searchFields: (row) => [row.name, row.slug, row.summary],
    filterValue: status,
    filterMatch: (row, value) => row.status === value,
    sort: (a, b) => a.sortOrder - b.sortOrder,
    page: readPage(params),
  });

  const columns: AdminColumn<AdminServiceRow>[] = [
    {
      key: "order",
      header: "#",
      width: "3rem",
      render: (row) => <span className="tabular-nums text-slate">{row.sortOrder}</span>,
    },
    {
      key: "name",
      header: "Service name",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/admin/services/${row.id}/edit`}
            className="font-medium text-navy hover:text-action hover:underline"
          >
            {row.name}
          </Link>
          <span className="text-caption text-slate">{truncate(row.summary, 70)}</span>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      hideOnMobile: true,
      render: (row) => (
        <code className="font-mono text-caption text-slate">/services/{row.slug}</code>
      ),
    },
    {
      key: "icon",
      header: "Icon",
      hideOnMobile: true,
      render: (row) => <code className="font-mono text-caption text-slate">{row.iconRef}</code>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/services/${row.id}/edit`}
            className="text-caption font-semibold text-action hover:underline"
          >
            Edit
          </Link>
          <Link
            href={`/services/${row.slug}`}
            className="text-caption font-semibold text-slate hover:text-action hover:underline"
          >
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Services"
        description="The public service category taxonomy, shared by the homepage, the services pages and the directory's service filter."
        actions={
          <Link
            href="/admin/services/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add service
          </Link>
        }
      />

      <ProvenanceNotice
        provenance="approved"
        entity="service categories"
        detail="Editing a slug here would break the public /services/[slug] routes and every ?service= filter link, so slug changes need a migration plan rather than a form field."
      />

      <AdminFilterBar
        action="/admin/services"
        query={query}
        searchLabel="Search services by name or slug"
        searchPlaceholder="Search services by name, slug or description"
        filterOptions={statusFilterOptions(services, (row) => row.status, SERVICE_STATUSES)}
        activeFilter={status}
        resultSummary={resultSummary(list.matched, list.total, "service")}
      />

      <AdminDataTable
        caption="Service categories"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Folder}
            title="No services match these filters"
            description="Clear the filters to see every service category."
          />
        }
      />

      <section
        aria-labelledby="service-sync"
        className="flex flex-col gap-2 rounded-card border border-border bg-white p-5"
      >
        <h2 id="service-sync" className="text-compact font-semibold text-navy">
          Where a service change would appear
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          A published service category is rendered by the homepage service grid, the{" "}
          <Link href="/services" className="font-medium text-action hover:underline">
            services directory
          </Link>
          , its own detail page, the header and footer menus, and the professional directory&rsquo;s
          service filter. All six read one module today, so they cannot disagree. Synchronised
          publishing from the CMS depends on <code className="font-mono">services:listPublished</code>{" "}
          and <code className="font-mono">services:getBySlug</code> plus an authorized write path —
          none of which exists yet.
        </p>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
