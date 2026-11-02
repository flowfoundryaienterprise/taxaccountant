import Link from "next/link";
import {
  FileText,
  Plus,
} from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { CmsStatusNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminCountries, adminProfessionals, adminServices } from "@/lib/admin/admin-data";
import { demoArticles, demoPages } from "@/lib/admin/admin-fixtures";
import { formatDate, truncate } from "@/lib/admin/admin-formatters";
import { cn } from "@/lib/utils";

/**
 * CMS overview.
 *
 * Every figure on this screen is a count of rows the interface can actually
 * show, and each card says what it counted. There is no traffic, no
 * engagement, no revenue and no trend indicator: the project stores no such
 * data, so presenting any would be invention (brief section 5, "Do not
 * display invented operational metrics as production statistics").
 */

interface RecentRow {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
  href: string;
  provenance: "approved" | "demonstration";
}

export default function AdminOverviewPage() {
  const pages = demoPages;
  const articles = demoArticles;
  const services = adminServices();
  const countries = adminCountries();
  const professionals = adminProfessionals();

  const publishedPages = pages.filter((page) => page.status === "published").length;
  const draftArticles = articles.filter((article) => article.status === "draft").length;
  const publishedServices = services.filter((service) => service.status === "published").length;
  const discoverableCountries = countries.filter((country) => country.discoverable).length;
  const publishedListings = professionals.filter(
    (professional) => professional.status === "published",
  ).length;

  /*
   * "Pending review" is a real count of records sitting in the `review`
   * state across both content types, not a decorative number — which is why
   * the fixtures deliberately include some.
   */
  const pendingReview =
    pages.filter((page) => page.status === "review").length +
    articles.filter((article) => article.status === "review").length;

  const recent: RecentRow[] = [
    ...pages.map((page) => ({
      id: `page-${page.id}`,
      title: page.title,
      type: page.kind === "page" ? "Page" : page.kind === "guide" ? "Guide" : "Glossary",
      status: page.status,
      updatedAt: page.updatedAt,
      href: `/admin/pages/${page.id}/edit`,
      provenance: page.provenance,
    })),
    ...articles.map((article) => ({
      id: `article-${article.id}`,
      title: article.title,
      type: "Article",
      status: article.status,
      updatedAt: article.updatedAt,
      href: `/admin/articles/${article.id}/edit`,
      provenance: article.provenance,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  const columns: AdminColumn<RecentRow>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <Link href={row.href} className="font-medium text-navy hover:text-action hover:underline">
          {truncate(row.title, 60)}
        </Link>
      ),
    },
    { key: "type", header: "Type", hideOnMobile: true, render: (row) => row.type },
    { key: "status", header: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "updated",
      header: "Last updated",
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
        <Link href={row.href} className="text-caption font-medium text-action hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  const quickActions = [
    { label: "Create Page", href: "/admin/pages/new", available: true },
    { label: "Add Service", href: "/admin/services/new", available: true },
    { label: "Create Article", href: "/admin/articles/new", available: true },
    { label: "Manage Countries", href: "/admin/countries", available: true },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Overview"
        description="Manage the public content and discovery information for TaxAccountant.com."
      />

      <CmsStatusNotice />

      <section aria-labelledby="overview-counts" className="flex flex-col gap-4">
        <h2 id="overview-counts" className="text-compact font-medium text-navy">
          At a glance
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Published pages",
              value: publishedPages,
              caption: `of ${pages.length} page records — demonstration fixtures`,
              href: "/admin/pages",
            },
            {
              label: "Draft articles",
              value: draftArticles,
              caption: `of ${articles.length} article records — demonstration fixtures`,
              href: "/admin/articles",
            },
            {
              label: "Service categories",
              value: publishedServices,
              caption: "published and live on the public site",
              href: "/admin/services",
            },
            {
              label: "Discoverable countries",
              value: discoverableCountries,
              caption: `of ${countries.length} country records. None is activated for transactions.`,
              href: "/admin/countries",
            },
            {
              label: "Published listings",
              value: publishedListings,
              caption: `of ${professionals.length} professional records`,
              href: "/admin/professionals",
            },
            {
              label: "Awaiting review",
              value: pendingReview,
              caption: "pages and articles in the review state",
              href: "/admin/articles?status=review",
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <AdminStatCard
                label={stat.label}
                value={stat.value}
                caption={stat.caption}
                href={stat.href}
              />
            </div>
          ))}
        </div>

        <p className="max-w-[92ch] text-caption text-slate">
          Service, country and professional counts are read from the modules the public site
          renders, so they describe what is genuinely live. Page and article counts come from
          demonstration fixtures, because no page or article has been authored yet. No figure here
          is a traffic, engagement or revenue metric — none of that data exists.
        </p>
      </section>

      <section aria-labelledby="quick-actions" className="flex flex-col gap-3">
        <h2 id="quick-actions" className="text-compact font-medium text-navy">
          Quick actions
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-input border border-border bg-white px-4",
                "text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle",
              )}
            >
              <Plus className="h-4 w-4 text-action" aria-hidden />
              {action.label}
            </Link>
          ))}
        </div>

        <p className="max-w-[92ch] text-caption text-slate">
          These open the create and management screens so the forms and their validation can be
          reviewed. Saving is disabled throughout — see below.
        </p>
      </section>

      <ReadOnlyNotice />

      <section aria-labelledby="recent-content" className="flex flex-col gap-3">
        <h2 id="recent-content" className="text-compact font-medium text-navy">
          Recently updated content
        </h2>

        <AdminDataTable
          caption="Recently updated pages and articles"
          columns={columns}
          rows={recent}
          rowKey={(row) => row.id}
          empty={
            <AdminEmptyState
              icon={FileText}
              title="No content records yet"
              description="Pages and articles will appear here once the content collections hold rows."
            />
          }
        />
      </section>
    </div>
  );
}
