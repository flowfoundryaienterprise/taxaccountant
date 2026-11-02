import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Plus } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
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
import { contentRepository, toAdminArticleRow } from "@/lib/cms/content-adapter";
import { toPublishableArticles } from "@/lib/marketplace/content-mappers";
import type { AdminArticleRow } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Articles and resources" };

/**
 * Article and resource management.
 *
 * The editorial-integrity columns are the point of this screen: author,
 * reviewer and the date a review actually happened. Tax content that has
 * not been reviewed by an authorized professional must be visibly
 * unreviewed rather than quietly published (brief section 11), so the
 * reviewer column shows "Not reviewed" rather than being left blank.
 */
export default async function AdminArticlesScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const status = readParam(params, "status") || "all";

  const { items } = await contentRepository.listArticles({ q: "" });
  const allArticles = items.map(toAdminArticleRow);

  /*
   * What actually reaches the public site, computed by running every CMS
   * record through the real public projection — the same
   * `toPublishableArticles` the public pages use, so this cannot drift from
   * what a reader would see. `/resources` now genuinely serves these.
   */
  const publiclyVisible = toPublishableArticles(items);

  const list = buildAdminList<AdminArticleRow>({
    rows: allArticles,
    query,
    searchFields: (row) => [row.title, row.slug, row.category, row.excerpt ?? ""],
    filterValue: status,
    filterMatch: (row, value) => row.status === value,
    sort: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    page: readPage(params),
  });

  const columns: AdminColumn<AdminArticleRow>[] = [
    {
      key: "title",
      header: "Article title",
      render: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/admin/articles/${row.id}/edit`}
            className="font-medium text-navy hover:text-action hover:underline"
          >
            {truncate(row.title, 60)}
          </Link>
          <span className="text-caption text-slate sm:hidden">{row.category}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", hideOnMobile: true, render: (row) => row.category },
    {
      key: "author",
      header: "Author",
      hideOnMobile: true,
      render: (row) => row.author ?? <span className="text-slate">Unattributed</span>,
    },
    {
      key: "reviewer",
      header: "Reviewed",
      hideOnMobile: true,
      render: (row) =>
        row.reviewer && row.reviewedAt ? (
          <span className="flex flex-col gap-0.5">
            <span className="text-caption text-navy">{row.reviewer}</span>
            <span className="font-mono text-caption tabular-nums text-slate">{formatDate(row.reviewedAt)}</span>
          </span>
        ) : (
          <AdminStatusBadge status="not_reviewed" tone="warning" label="Not reviewed" />
        ),
    },
    { key: "status", header: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "published",
      header: "Published",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono tabular-nums">{formatDate(row.publishedAt) ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Link
          href={`/admin/articles/${row.id}/edit`}
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
        title="Articles and resources"
        description="Editorial content with author and reviewer attribution. Tax content is not published without a recorded review."
        actions={
          <Link
            href="/admin/articles/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-input bg-action px-4 text-compact font-medium text-white transition-colors duration-150 hover:bg-[#0668c7]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create article
          </Link>
        }
      />

      <AdminFilterBar
        action="/admin/articles"
        query={query}
        searchLabel="Search articles by title or category"
        searchPlaceholder="Search articles by title, slug, category or excerpt"
        filterOptions={statusFilterOptions(allArticles, (row) => row.status, CONTENT_STATUSES)}
        activeFilter={status}
        resultSummary={resultSummary(list.matched, list.total, "article")}
      />

      <AdminDataTable
        caption="Articles and resources"
        columns={columns}
        rows={list.rows}
        rowKey={(row) => row.id}
        empty={
          <AdminEmptyState
            icon={Newspaper}
            title={
              query || status !== "all" ? "No articles match these filters" : "No articles yet"
            }
            description={
              query || status !== "all"
                ? "Try a different search term, or clear the filters."
                : "Article records will appear here once the contentPages collection holds rows of kind 'blog'."
            }
          />
        }
      />

      <AdminPagination
        action="/admin/articles"
        page={list.page}
        pageCount={list.pageCount}
        total={list.matched}
        pageSize={list.pageSize}
        preserve={{ q: query || undefined, status: status !== "all" ? status : undefined }}
      />

      <section
        aria-labelledby="public-visibility"
        className="flex flex-col gap-2 rounded-card border border-border bg-white p-5"
      >
        <h2 id="public-visibility" className="text-compact font-medium text-navy">
          What is publicly visible right now
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          <strong className="font-semibold text-navy">
            {publiclyVisible.length} of {allArticles.length} records
          </strong>{" "}
          pass the public gate — published <em>and</em> carrying a recorded editorial review. The
          figure is computed by running every record through{" "}
          <code className="font-mono">toPublishableArticles</code>, the same projection the public
          pages use, so it cannot disagree with what a reader would see.
        </p>
        <p className="max-w-[92ch] text-caption text-slate">
          <code className="font-mono">content:listPublishedResources</code> now genuinely serves
          these to{" "}
          <Link href="/resources" className="font-medium text-action hover:underline">
            /resources
          </Link>
          , filtered to <code className="font-mono">published</code> status server-side — the
          count above is what a reader would actually see there.
        </p>
      </section>

      <section
        aria-labelledby="editorial-integrity"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="editorial-integrity" className="text-compact font-medium text-navy">
          Editorial review is a publication requirement
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          Tax content carries real consequences for the person reading it. An article is only
          eligible for publication once an authorized professional has reviewed it and that review
          is recorded against the row — author attribution alone is not enough. Where an article
          would state anything jurisdiction-specific, the jurisdiction must be set on the record so
          the reader is never shown one country&rsquo;s position as if it were universal. The
          platform publishes no rates, thresholds or deadlines at all.
        </p>
      </section>
    </div>
  );
}
