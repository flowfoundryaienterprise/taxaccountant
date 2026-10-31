import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { adminProfessionals, countryName, serviceName } from "@/lib/admin/admin-data";
import { pluralize } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  statusFilterOptions,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminProfessionalRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Professionals" };

const LISTING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

/**
 * Professional listing records.
 *
 * ## What this is not
 * This is **not** the Phase 2 verification dashboard. It lists what the
 * marketplace holds about each listing and its publication state. It offers
 * no approve, reject, verify or suspend action, exposes no credential
 * evidence, and shows no identity document — none of that data is in the
 * model, so no screen here can leak it.
 *
 * The credential column reports a reviewed state only when a documented
 * review actually wrote a timestamp, which is the same two-condition test
 * the public profile uses before showing a badge. Every record currently
 * reports "Not reviewed", because none has been.
 */
export default async function AdminProfessionalsScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const status = readParam(params, "status") || "all";
  const professionals = adminProfessionals();

  const list = buildAdminList<AdminProfessionalRow>({
    rows: professionals,
    query,
    searchFields: (row) => [
      row.displayName,
      row.firmName ?? "",
      row.city,
      countryName(row.countryCode),
      ...row.serviceSlugs.map(serviceName),
    ],
    filterValue: status,
    filterMatch: (row, value) => row.status === value,
    sort: (a, b) => a.displayName.localeCompare(b.displayName),
    page: readPage(params),
  });

  const columns: AdminColumn<AdminProfessionalRow>[] = [
    {
      key: "name",
      header: "Professional",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/admin/professionals/${row.slug}`}
            className="font-medium text-navy hover:text-action hover:underline"
          >
            {row.displayName}
          </Link>
          <span className="text-caption text-slate sm:hidden">
            {row.city}, {countryName(row.countryCode)}
          </span>
        </div>
      ),
    },
    {
      key: "firm",
      header: "Firm",
      hideOnMobile: true,
      render: (row) => row.firmName ?? <span className="text-slate">—</span>,
    },
    {
      key: "country",
      header: "Country",
      hideOnMobile: true,
      render: (row) => `${row.city}, ${countryName(row.countryCode)}`,
    },
    {
      key: "services",
      header: "Services",
      hideOnMobile: true,
      render: (row) =>
        row.serviceSlugs.length ? (
          <span title={row.serviceSlugs.map(serviceName).join(", ")}>
            {pluralize(row.serviceSlugs.length, "service")}
          </span>
        ) : (
          "None"
        ),
    },
    {
      key: "status",
      header: "Listing status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "credentials",
      header: "Credentials",
      hideOnMobile: true,
      render: (row) => (
        <AdminStatusBadge
          status={row.credentialsReviewed ? "verified" : "not_reviewed"}
          tone={row.credentialsReviewed ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/professionals/${row.slug}`}
          className="text-caption font-medium text-action hover:underline"
        >
          View details
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Professional listings"
        description="Listing records and their publication state. Credential verification is a Phase 2 workflow and is not performed here."
      />

      <ProvenanceNotice
        provenance="approved"
        entity="professional listing records"
        detail="Unpublished records are included here because an internal publication view needs them; the public site reads a separate function that refuses them."
      />

      <AdminFilterBar
        action="/admin/professionals"
        query={query}
        searchLabel="Search professionals by name, firm or location"
        searchPlaceholder="Search by name, firm, city, country or service"
        filterOptions={statusFilterOptions(professionals, (row) => row.status, LISTING_STATUSES)}
        activeFilter={status}
        resultSummary={resultSummary(list.matched, list.total, "listing")}
      />

      <AdminDataTable
        caption="Professional listing records"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Users}
            title="No listings match these filters"
            description="Clear the filters to see every professional record."
          />
        }
      />

      <section
        aria-labelledby="verification-scope"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="verification-scope" className="text-compact font-medium text-navy">
          Verification is out of scope here
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          There is no approve, reject or verify action on this screen, and no credential document,
          licence number or identity evidence is shown — that material is private source data and
          is not part of the public listing model at all. A listing may only be marked verified
          after a documented review writes a review record, which is the Phase 2{" "}
          <code className="font-mono">verification:*</code> workflow. Every record currently reads
          &ldquo;Not reviewed&rdquo;, which is accurate.
        </p>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
