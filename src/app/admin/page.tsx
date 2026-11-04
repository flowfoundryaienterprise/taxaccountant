import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MessageSquareText,
  Newspaper,
  Plus,
  Wrench,
} from "lucide-react";

import { LiveApplications } from "@/components/admin/live-applications";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { buttonVariants } from "@/components/ui/button";

import { formatDate, truncate } from "@/lib/admin/admin-formatters";
import { contentRepository } from "@/lib/cms/content-adapter";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

/** Authorized live overview; bounded counts are displayed as 100+ above the query cap. */
export default async function AdminOverviewPage() {
  const [pagesResult, articlesResult, overview, staff] = await Promise.all([
    contentRepository.listPages({ q: "" }),
    contentRepository.listArticles({ q: "" }),
    fetchAuthQuery(api.staff.marketplaceOverview, {}),
    fetchAuthQuery(api.staff.currentStaff, {}),
  ]);
  const pages = pagesResult.items;
  const articles = articlesResult.items;
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
    { label: "Review applications", href: "/admin/applications", icon: FileText },
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
              Live data · counts capped at 100+
            </span>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View website
            </Link>
            <button type="button" disabled title="Professional creation is not available in this console" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}><Plus className="h-4 w-4" aria-hidden />Add professional</button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon="profiles"
          label="Published profiles"
          value={overview.published}
          caption="Approved published profiles"
          href="/admin/applications"
        />
        <AdminStatCard
          icon="applications"
          label="Pending applications"
          value={overview.pending}
          caption="Awaiting administrator review"
          href="/admin/applications"
        />
        <AdminStatCard
          icon="enquiries"
          label="New inquiries"
          value={overview.enquiries}
          caption="New professional enquiries"
          href="/admin/enquiries"
        />
        <AdminStatCard
          icon="articles"
          label="Active subscribers"
          value={overview.subscribers}
          caption="Active Stripe subscriptions"
          href="/admin/subscriptions"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {staff?.role === "cms_admin" ? <LiveApplications limit={6} /> : <p className="rounded-card border border-border bg-white p-6">Professional review requires an administrator account.</p>}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">Quick actions</h2>
            <ul className="flex flex-col gap-1">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex items-center justify-between gap-2 rounded-input border border-border px-2.5 py-2 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle"
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
            <Link href="/admin/enquiries" className="text-compact font-medium text-action hover:underline">
              View all →
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            {overview.latest.map((message) => (
              <li
                key={message.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
              >
                <span className="min-w-0 truncate text-compact text-navy">
                  {truncate(message.service, 48)}<span className="block text-caption text-slate">{message.professional} · {new Date(message.createdAt).toLocaleDateString("en-US", {timeZone:"UTC"})}</span>
                </span>
                <AdminStatusBadge status={message.status} />
              </li>
            ))}
            {overview.latest.length === 0 ? (
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
        Only approved content is published to the website. Counts above 100 are shown as 100+.
      </p>
    </div>
  );
}
