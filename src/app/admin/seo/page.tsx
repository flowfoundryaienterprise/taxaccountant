import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { adminCountries, adminServices } from "@/lib/admin/admin-data";
import { truncate } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import { demoArticles, demoPages } from "@/lib/admin/admin-fixtures";
import type { AdminSeoRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "SEO Management" };

/**
 * Central SEO overview.
 *
 * ## Indexing eligibility is reported, not configured
 * The `indexable` column reflects what each route's `generateMetadata`
 * actually emits today, read from the codebase rather than from an editable
 * field. Several public routes are deliberately `noindex` because they
 * render development fixtures, and an editor must not be able to flip that
 * from a form while the underlying data is still fictional — the Day 6
 * brief's rules are explicit about not indexing fictional example data,
 * private profiles or unsupported country pages.
 *
 * A duplicate-canonical check runs over the rows below, because two pieces
 * of content claiming one canonical URL is the SEO fault most worth
 * catching early.
 */
function buildSeoRows(): AdminSeoRow[] {
  const rows: AdminSeoRow[] = [];

  rows.push({
    id: "route-home",
    contentTitle: "Homepage",
    path: "/",
    contentType: "Route",
    seoTitle: "TaxAccountant.com",
    metaDescription:
      "TaxAccountant.com connects customers with qualified tax and accounting professionals worldwide.",
    status: "published",
    indexable: true,
    indexableReason: "Indexable — static marketing content.",
    provenance: "approved",
  });

  rows.push({
    id: "route-services",
    contentTitle: "Services directory",
    path: "/services",
    contentType: "Route",
    seoTitle: "Tax & Accounting Services",
    status: "published",
    indexable: true,
    indexableReason: "Indexable — describes real service categories.",
    provenance: "approved",
  });

  for (const service of adminServices()) {
    rows.push({
      id: `service-${service.slug}`,
      contentTitle: service.name,
      path: `/services/${service.slug}`,
      contentType: "Service",
      seoTitle: service.seo.title,
      metaDescription: service.seo.description,
      status: service.status,
      indexable: true,
      indexableReason: "Indexable — jurisdiction-neutral category content.",
      provenance: "approved",
    });
  }

  rows.push({
    id: "route-resources",
    contentTitle: "Guides & Resources",
    path: "/resources",
    contentType: "Route",
    seoTitle: "Guides & Resources",
    metaDescription:
      "Reviewed guides about tax and accounting topics, written in general terms and scoped to the jurisdiction they describe.",
    status: "published",
    indexable: true,
    indexableReason:
      "Indexable — serves only published, reviewed resources, of which there are currently none, so it indexes an honest empty state.",
    provenance: "approved",
  });

  rows.push({
    id: "route-directory",
    contentTitle: "Find an Accountant",
    path: "/find-accountant",
    contentType: "Route",
    seoTitle: "Find a Tax Accountant",
    metaDescription:
      "Explore tax and accounting professionals by country, tax jurisdiction, specialty and language.",
    status: "published",
    indexable: false,
    indexableReason: "noindex — results are development fixtures, not published listings.",
    provenance: "approved",
  });

  rows.push({
    id: "route-countries",
    contentTitle: "Countries index",
    path: "/countries",
    contentType: "Route",
    status: "published",
    indexable: false,
    indexableReason: "noindex — coverage is derived from development fixtures.",
    provenance: "approved",
  });

  for (const country of adminCountries()) {
    rows.push({
      id: `country-${country.code}`,
      contentTitle: country.name,
      path: `/countries/${country.code}`,
      contentType: "Country",
      seoTitle: country.seo.title,
      metaDescription: country.seo.description,
      status: country.discoverable ? "published" : "draft",
      indexable: false,
      indexableReason: country.discoverable
        ? "noindex — service coverage comes from development fixtures."
        : "noindex — country is not open for discovery.",
      provenance: "approved",
    });
  }

  for (const page of demoPages) {
    rows.push({
      id: `page-${page.id}`,
      contentTitle: page.title,
      path: `/${page.slug}`,
      contentType: "Page",
      seoTitle: page.seo.title,
      metaDescription: page.seo.description,
      status: page.status,
      indexable: page.status === "published",
      indexableReason:
        page.status === "published"
          ? "Would be indexable once the route exists."
          : "Not published, so not eligible for indexing.",
      provenance: "demonstration",
    });
  }

  for (const article of demoArticles) {
    rows.push({
      id: `article-${article.id}`,
      contentTitle: article.title,
      path: `/resources/${article.slug}`,
      contentType: "Article",
      seoTitle: article.seo.title,
      metaDescription: article.seo.description,
      status: article.status,
      /*
       * The route exists as of Day 7, but the public repository serves
       * nothing, so no article is reachable or indexable today. The column
       * reports eligibility, which is a different question from whether the
       * record is currently served.
       */
      indexable: false,
      indexableReason:
        article.status !== "published"
          ? "Not published, so not eligible for indexing."
          : !article.reviewedAt
            ? "Published without a recorded review — must never be indexed."
            : "Eligible, but not served: the public repository returns no resources yet.",
      provenance: "demonstration",
    });
  }

  return rows;
}

export default async function AdminSeoScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const indexing = readParam(params, "indexing") || "all";
  const rows = buildSeoRows();

  // Duplicate canonical paths split ranking signals and are almost always a
  // mistake, so they are surfaced rather than left to be discovered later.
  const pathCounts = new Map<string, number>();
  for (const row of rows) pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  const duplicates = [...pathCounts.entries()].filter(([, count]) => count > 1);

  const missingDescription = rows.filter((row) => !row.metaDescription).length;

  const list = buildAdminList<AdminSeoRow>({
    rows,
    query,
    searchFields: (row) => [row.contentTitle, row.path, row.contentType, row.seoTitle ?? ""],
    filterValue: indexing,
    filterMatch: (row, value) =>
      value === "indexable"
        ? row.indexable
        : value === "noindex"
          ? !row.indexable
          : !row.metaDescription,
    sort: (a, b) => a.path.localeCompare(b.path),
    page: readPage(params),
    pageSize: 15,
  });

  const columns: AdminColumn<AdminSeoRow>[] = [
    {
      key: "title",
      header: "Content",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium text-navy">{truncate(row.contentTitle, 48)}</span>
          <code className="font-mono text-caption text-slate">{row.path}</code>
        </div>
      ),
    },
    { key: "type", header: "Type", hideOnMobile: true, render: (row) => row.contentType },
    {
      key: "seoTitle",
      header: "SEO title",
      hideOnMobile: true,
      render: (row) =>
        row.seoTitle ? (
          truncate(row.seoTitle, 40)
        ) : (
          <span className="text-warning">Falls back to content title</span>
        ),
    },
    {
      key: "description",
      header: "Meta description",
      hideOnMobile: true,
      render: (row) =>
        row.metaDescription ? (
          truncate(row.metaDescription, 60)
        ) : (
          <span className="text-warning">Not set</span>
        ),
    },
    { key: "status", header: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "indexable",
      header: "Indexing",
      render: (row) => (
        <span className="flex flex-col gap-1">
          <AdminStatusBadge
            status={row.indexable ? "published" : "draft"}
            label={row.indexable ? "Indexable" : "noindex"}
            tone={row.indexable ? "success" : "neutral"}
          />
          <span className="text-caption text-slate">{row.indexableReason}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="SEO Management"
        description="Titles, descriptions, canonical paths and indexing eligibility across every route and content record."
      />

      <ProvenanceNotice
        provenance="approved"
        entity="route metadata records"
        detail="Indexing eligibility is read from what each route's generateMetadata actually emits, so this screen reports the live position rather than an editable wish."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-card border border-border bg-white p-4">
          <p className="text-caption text-slate">Indexable routes</p>
          <p className="text-heading-sm font-semibold text-navy">
            {rows.filter((row) => row.indexable).length}
          </p>
          <p className="text-caption text-slate">of {rows.length} content records</p>
        </div>
        <div className="flex flex-col gap-1 rounded-card border border-border bg-white p-4">
          <p className="text-caption text-slate">Missing meta description</p>
          <p className="text-heading-sm font-semibold text-navy">{missingDescription}</p>
          <p className="text-caption text-slate">search engines will choose an excerpt</p>
        </div>
        <div className="flex flex-col gap-1 rounded-card border border-border bg-white p-4">
          <p className="text-caption text-slate">Duplicate canonical paths</p>
          <p className="text-heading-sm font-semibold text-navy">{duplicates.length}</p>
          <p className="text-caption text-slate">
            {duplicates.length === 0 ? "no conflicts detected" : "must be resolved"}
          </p>
        </div>
      </div>

      {duplicates.length ? (
        <div role="alert" className="flex flex-col gap-2 rounded-card border border-danger/40 bg-white p-4">
          <h2 className="text-compact font-semibold text-danger">Duplicate canonical paths</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-caption text-slate">
            {duplicates.map(([path, count]) => (
              <li key={path}>
                <code className="font-mono text-navy">{path}</code> is claimed by {count} records.
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdminFilterBar
        action="/admin/seo"
        query={query}
        searchLabel="Search content by title or path"
        searchPlaceholder="Search by title, path, type or SEO title"
        filterName="indexing"
        filterLabel="Indexing"
        filterOptions={[
          { value: "all", label: "All", count: rows.length },
          {
            value: "indexable",
            label: "Indexable",
            count: rows.filter((row) => row.indexable).length,
          },
          { value: "noindex", label: "noindex", count: rows.filter((row) => !row.indexable).length },
          { value: "missing-description", label: "No description", count: missingDescription },
        ]}
        activeFilter={indexing}
        resultSummary={resultSummary(list.matched, list.total, "record")}
      />

      <AdminDataTable
        caption="SEO metadata across content"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Search}
            title="No records match these filters"
            description="Clear the filters to see every content record."
          />
        }
      />

      <section
        aria-labelledby="indexing-rules"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="indexing-rules" className="text-compact font-semibold text-navy">
          Indexing rules this project enforces
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-caption text-slate">
          <li>
            Development fixtures are never indexed. The{" "}
            <Link href="/find-accountant" className="font-medium text-action hover:underline">
              directory
            </Link>
            , the country pages and every professional profile are <code className="font-mono">noindex</code>{" "}
            while their data is fictional.
          </li>
          <li>Unpublished, suspended and draft content is not eligible for indexing at all.</li>
          <li>Countries that are not open for discovery do not produce indexable pages.</li>
          <li>
            Structured data is emitted only where the underlying facts are real — no{" "}
            <code className="font-mono">Person</code> or review markup is generated for fixtures.
          </li>
          <li>An article published without a recorded editorial review must not be indexed.</li>
        </ul>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
