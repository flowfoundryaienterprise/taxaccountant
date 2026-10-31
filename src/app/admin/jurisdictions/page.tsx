import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { adminJurisdictions, countryName, serviceName } from "@/lib/admin/admin-data";
import { pluralize } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminJurisdictionRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Tax jurisdictions" };

const LEVEL_LABELS: Record<AdminJurisdictionRow["level"], string> = {
  national: "National",
  state: "State",
  province: "Province",
  local: "Local",
  other: "Other",
};

/**
 * Tax jurisdiction taxonomy.
 *
 * A viewing and organizing interface over the approved taxonomy, and
 * nothing more. It states which authorities exist, which country each
 * belongs to, and which service categories are genuinely represented for it
 * in current listings.
 *
 * It deliberately does **not** state tax rules, licence requirements,
 * regulatory classifications or cross-border service rights (brief section
 * 9). `level` is reported only where the taxonomy already settles it
 * structurally — a national revenue authority code, or the only jurisdiction
 * for its country — and everything else reports "Other" rather than a guess.
 */
export default async function AdminJurisdictionsScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const country = readParam(params, "country") || "all";
  const jurisdictions = adminJurisdictions();

  const countries = [...new Set(jurisdictions.map((row) => row.countryCode))].sort();

  const list = buildAdminList<AdminJurisdictionRow>({
    rows: jurisdictions,
    query,
    searchFields: (row) => [row.label, row.code, countryName(row.countryCode)],
    filterValue: country,
    filterMatch: (row, value) => row.countryCode === value,
    sort: (a, b) =>
      countryName(a.countryCode).localeCompare(countryName(b.countryCode)) ||
      a.label.localeCompare(b.label),
    page: readPage(params),
  });

  const columns: AdminColumn<AdminJurisdictionRow>[] = [
    {
      key: "label",
      header: "Jurisdiction",
      render: (row) => <span className="font-medium text-navy">{row.label}</span>,
    },
    {
      key: "country",
      header: "Country",
      render: (row) => (
        <Link
          href={`/admin/countries/${row.countryCode}`}
          className="text-slate hover:text-action hover:underline"
        >
          {countryName(row.countryCode)}
        </Link>
      ),
    },
    {
      key: "code",
      header: "Code",
      hideOnMobile: true,
      render: (row) => <code className="font-mono text-caption text-slate">{row.code}</code>,
    },
    {
      key: "level",
      header: "Type",
      hideOnMobile: true,
      render: (row) => LEVEL_LABELS[row.level],
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <AdminStatusBadge
          status={row.active ? "published" : "archived"}
          label={row.active ? "Active" : "Inactive"}
          tone={row.active ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "services",
      header: "Service categories",
      hideOnMobile: true,
      render: (row) =>
        row.serviceSlugs.length ? (
          <span title={row.serviceSlugs.map(serviceName).join(", ")}>
            {pluralize(row.serviceSlugs.length, "category", "categories")}
          </span>
        ) : (
          "None represented"
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tax jurisdictions"
        description="The tax authorities the marketplace distinguishes between, grouped by the country that administers them."
      />

      <ProvenanceNotice
        provenance="approved"
        entity="tax jurisdictions"
        detail="Service categories per jurisdiction are derived from current listings, so this column reports representation, not permission."
      />

      <AdminFilterBar
        action="/admin/jurisdictions"
        query={query}
        searchLabel="Search jurisdictions by name or code"
        searchPlaceholder="Search jurisdictions by name, code or country"
        filterName="country"
        filterLabel="Country"
        filterOptions={[
          { value: "all", label: "All", count: jurisdictions.length },
          ...countries.map((code) => ({
            value: code,
            label: countryName(code),
            count: jurisdictions.filter((row) => row.countryCode === code).length,
          })),
        ]}
        activeFilter={country}
        resultSummary={resultSummary(list.matched, list.total, "jurisdiction")}
      />

      <AdminDataTable
        caption="Tax jurisdictions"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Scale}
            title="No jurisdictions match these filters"
            description="Clear the filters to see every jurisdiction in the taxonomy."
          />
        }
      />

      <section
        aria-labelledby="jurisdiction-scope"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="jurisdiction-scope" className="text-compact font-medium text-navy">
          What this screen does not record
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          No tax rate, threshold, deadline, filing requirement, licence rule or cross-border
          service right is held here or anywhere else in this project. A jurisdiction record says
          that an authority exists and that the directory can filter by it. Whether a given
          professional may act before that authority is a separate, per-professional fact stored on
          their service mappings — and one this marketplace has not verified for anybody.
        </p>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
