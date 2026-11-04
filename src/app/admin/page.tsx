import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MessageSquareText,
  Newspaper,
  Plus,
  Wrench,
} from "lucide-react";

import { AdminApplicationsPanel } from "@/components/admin/admin-applications-panel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { adminProfessionals } from "@/lib/admin/admin-data";
import { formatDate, truncate } from "@/lib/admin/admin-formatters";
import { contentRepository } from "@/lib/cms/content-adapter";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

/**
 * CMS overview, redesigned to the approved client mockup: four headline
 * counts, a tabbed professional-applications queue, quick actions, a
 * review checklist, and the latest inquiries and content drafts side by
 * side.
 *
 * ## Why "Sample data · design preview"
 * Professional records are still the fixture catalogue
 * (`@/lib/admin/admin-data`, `provenance: "demonstration"`/`"approved"` —
 * see the note there), not a live Convex collection, so this screen mixes
 * real counts (pages, articles, inbound messages — all genuine
 * `cms:*`/`contact:*` Convex reads) with that fixture data. The badge says
 * so plainly rather than letting the two blend together, the same rule
 * every other screen in this CMS follows for its `provenance` labels.
 */
export default async function AdminOverviewPage() {
  const [pagesResult, articlesResult, newMessages] = await Promise.all([
    contentRepository.listPages({ q: "" }),
    contentRepository.listArticles({ q: "" }),
    fetchAuthQuery(api.contact.listMessages, {
      status: "new",
      paginationOpts: { numItems: 50, cursor: null },
    }),
  ]);
  const pages = pagesResult.items;
  const articles = articlesResult.items;
  const professionals = adminProfessionals();

  const publishedListings = professionals.filter((row) => row.status === "published").length;
  const pendingApplications = professionals.filter((row) => row.status === "review").length;
  const publishedArticles = articles.filter((article) => article.editorial.status === "published").length;
  const newInquiryCount = newMessages.page.length;

  const drafts = [
    ...pages.map((page) => ({
      id: `page-${page.id}`,
      title: page.title,
      status: page.editorial.status,
      updatedAt: page.editorial.updatedAt,
      href: `/admin/pages/${page.id}/edit`,
    })),
    ...articles.map((article) => ({
      id: `article-${article.id}`,
      title: article.title,
      status: article.editorial.status,
      updatedAt: article.editorial.updatedAt,
      href: `/admin/articles/${article.id}/edit`,
    })),
  ]
    .filter((row) => row.status === "draft" || row.status === "review")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const quickActions = [
    { label: "Review applications", href: "/admin/professionals", icon: FileText },
    { label: "Create blog article", href: "/admin/articles/new", icon: Newspaper },
    { label: "Edit homepage", href: "/admin/pages", icon: MessageSquareText },
    { label: "Manage services", href: "/admin/services", icon: Wrench },
  ];

  const checklist = [
    "Profile details complete",
    "Services and jurisdictions checked",
    "Credentials reviewed",
    "Ready for publication",
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Dashboard"
        description="Your marketplace at a glance."
        actions={
          <>
            <span className="inline-flex items-center rounded-full border border-border bg-subtle px-3 py-1 text-caption font-medium text-slate">
              Sample data · design preview
            </span>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View website
            </Link>
            <Link
              href="/admin/professionals"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add professional
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Published profiles"
          value={publishedListings}
          caption={`of ${professionals.length} professional records`}
          href="/admin/professionals"
        />
        <AdminStatCard
          label="Pending applications"
          value={pendingApplications}
          caption={pendingApplications > 0 ? "Needs review" : "Nothing waiting"}
          href="/admin/professionals"
        />
        <AdminStatCard
          label="New inquiries"
          value={newInquiryCount}
          caption="unread contact and interest submissions"
          href="/admin/messages"
        />
        <AdminStatCard
          label="Published articles"
          value={publishedArticles}
          caption={`of ${articles.length} article records`}
          href="/admin/articles"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminApplicationsPanel rows={professionals} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">Quick actions</h2>
            <ul className="flex flex-col gap-1">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex items-center justify-between gap-2 rounded-[0.625rem] px-2.5 py-2.5 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle"
                  >
                    <span className="flex items-center gap-2.5">
                      <action.icon className="h-4 w-4 text-action" aria-hidden />
                      {action.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-tint p-6">
            <h2 className="text-compact font-semibold text-navy">Review checklist</h2>
            <ul className="flex flex-col gap-2.5">
              {checklist.map((label) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-[0.3rem] border border-control bg-white"
                  />
                  <span className="text-compact text-navy">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
          <div className="flex items-center justify-between">
            <h2 className="text-compact font-semibold text-navy">Latest inquiries</h2>
            <Link href="/admin/messages" className="text-compact font-medium text-action hover:underline">
              View all →
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            {newMessages.page.slice(0, 3).map((message) => (
              <li
                key={message._id}
                className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
              >
                <span className="min-w-0 truncate text-compact text-navy">
                  {truncate(message.subject || message.message, 48)}
                </span>
                <AdminStatusBadge status={message.status} />
              </li>
            ))}
            {newMessages.page.length === 0 ? (
              <li className="py-4 text-compact text-slate">No new inquiries right now.</li>
            ) : null}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
          <div className="flex items-center justify-between">
            <h2 className="text-compact font-semibold text-navy">Content drafts</h2>
            <Link href="/admin/pages" className="text-compact font-medium text-action hover:underline">
              View all →
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            {drafts.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
              >
                <Link href={row.href} className="min-w-0 truncate text-compact text-navy hover:underline">
                  {truncate(row.title, 40)}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <AdminStatusBadge status={row.status} />
                  <span className="hidden text-caption text-slate sm:inline">
                    {formatDate(row.updatedAt) ?? "—"}
                  </span>
                </div>
              </li>
            ))}
            {drafts.length === 0 ? (
              <li className="py-4 text-compact text-slate">No drafts in progress.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className="max-w-[92ch] text-caption text-slate">
        Pending applications, published profiles and their types come from the professional
        fixture catalogue used throughout this CMS preview. Published pages, articles and new
        inquiries are read live from Convex.
      </p>
    </div>
  );
}
