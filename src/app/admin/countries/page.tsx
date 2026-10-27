import type { Metadata } from "next";
import Link from "next/link";
import { Globe2 } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { adminCountries, languageName } from "@/lib/admin/admin-data";
import { pluralize } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminCountryRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Countries" };

const DISCOVERY_FILTERS = [
  { value: "discoverable", label: "Discoverable" },
  { value: "hidden", label: "Not discoverable" },
];

/**
 * Country management.
 *
 * ## The distinction this screen is built around
 * Four separate facts are rendered in four separate places and never
 * collapsed into one "active" flag:
 *
 *  1. **Discovery** — does the country appear in public browsing?
 *  2. **Marketplace activation** — onboarding, transactions and payments,
 *     each its own flag on the `countries` record.
 *  3. **Tax jurisdictions** — which authorities exist for the country.
 *  4. **Professional authorization** — a per-professional fact that lives on
 *     `professionalServices`, never on the country.
 *
 * A country being present, or even discoverable, says nothing about whether
 * the marketplace may operate there (brief section 8). Activation is
 * read-only throughout: flipping it is a commercial and regulatory decision
 * that needs an approval workflow, not a toggle in a table.
 */
export default async function AdminCountriesScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const discovery = readParam(params, "discovery") || "all";
  const countries = adminCountries();

  const list = buildAdminList<AdminCountryRow>({
    rows: countries,
    query,
    searchFields: (row) => [row.name, row.code, row.defaultLocale, row.displayCurrency],
    filterValue: discovery,
    filterMatch: (row, value) =>
      value === "discoverable" ? row.discoverable : !row.discoverable,
    sort: (a, b) => a.name.localeCompare(b.name),
    page: readPage(params),
  });

  const columns: AdminColumn<AdminCountryRow>[] = [
    {
      key: "name",
      header: "Country",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-9 shrink-0 items-center justify-center rounded-input border border-border bg-tint text-caption font-semibold text-navy"
          >
            {row.code}
          </span>
          <Link
            href={`/admin/countries/${row.code}`}
            className="min-w-0 font-medium text-navy hover:text-action hover:underline"
          >
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      key: "discovery",
      header: "Public discovery",
      render: (row) => (
        <AdminStatusBadge
          status={row.discoverable ? "published" : "draft"}
          label={row.discoverable ? "Discoverable" : "Not discoverable"}
          tone={row.discoverable ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "activation",
      header: "Marketplace activation",
      hideOnMobile: true,
      render: () => (
        // Every flag is false on every record, so this is a statement of
        // fact rather than a placeholder.
        <AdminStatusBadge status="draft" label="Not activated" tone="neutral" />
      ),
    },
    {
      key: "services",
      header: "Service categories",
      hideOnMobile: true,
      render: (row) =>
        row.serviceSlugs.length ? pluralize(row.serviceSlugs.length, "category", "categories") : "None",
    },
    {
      key: "languages",
      header: "Languages",
      hideOnMobile: true,
      render: (row) =>
        row.languageCodes.length
          ? row.languageCodes.map(languageName).join(", ")
          : "None recorded",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/countries/${row.code}`}
          className="text-caption font-semibold text-action hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Countries"
        description="Country records, their public discovery status and their marketplace activation flags — four separate facts, kept separate."
      />

      <ProvenanceNotice
        provenance="approved"
        entity="country records"
        detail="Service categories and languages are derived from the listings that genuinely exist for each country, never asserted."
      />

      <AdminFilterBar
        action="/admin/countries"
        query={query}
        searchLabel="Search countries by name or ISO code"
        searchPlaceholder="Search countries by name, ISO code, locale or currency"
        filterName="discovery"
        filterLabel="Discovery"
        filterOptions={[
          { value: "all", label: "All", count: countries.length },
          {
            ...DISCOVERY_FILTERS[0],
            count: countries.filter((country) => country.discoverable).length,
          },
          {
            ...DISCOVERY_FILTERS[1],
            count: countries.filter((country) => !country.discoverable).length,
          },
        ]}
        activeFilter={discovery}
        resultSummary={resultSummary(list.matched, list.total, "country")}
      />

      <AdminDataTable
        caption="Country records"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Globe2}
            title="No countries match these filters"
            description="Clear the filters to see every country record."
          />
        }
      />

      <section
        aria-labelledby="activation-note"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="activation-note" className="text-compact font-semibold text-navy">
          Why activation is not editable here
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          Onboarding, transaction and payment activation are regulatory and commercial decisions,
          not content settings. DATABASE.md models them as three independent flags precisely so
          that enabling discovery in a country cannot silently enable trading there. Making them
          editable requires the approved country-activation checklist and an authorized mutation
          that records who approved the change — <code className="font-mono">taxonomy:manageCountry</code>{" "}
          in API.md section 3. Until that exists these flags are read-only, and all of them are
          currently off.
        </p>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
