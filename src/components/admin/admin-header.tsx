"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Menu, Search, ShieldAlert } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { adminBreadcrumbs } from "@/lib/admin/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  pathname: string;
  onOpenSidebar: () => void;
  /** Replaces the final breadcrumb with a record title instead of its id. */
  lastCrumbLabel?: string;
}

/**
 * CMS top bar: sidebar toggle, breadcrumbs, content search, environment
 * indicator.
 *
 * ## No account area
 * The brief allows a user/account area "only if actual authentication data
 * is available". There is none — no Better Auth integration, no session, no
 * identity of any kind exists in this project — so rather than render an
 * avatar and a plausible-looking name, the header states the environment
 * it is actually running in. An invented "Signed in as Admin" chip would be
 * the exact kind of fiction the brief rules out.
 */
export function AdminHeader({ pathname, onOpenSidebar, lastCrumbLabel }: AdminHeaderProps) {
  const [query, setQuery] = React.useState("");
  const crumbs = adminBreadcrumbs(pathname, lastCrumbLabel);

  /*
   * Search navigates to the screens that genuinely hold searchable content
   * today. It deliberately does not pretend to be a global index: each of
   * those screens filters its own rows from the `?q=` parameter, which is
   * also what makes the result shareable and back/forward-correct.
   */
  const target = React.useMemo(() => {
    const section = crumbs.length > 1 ? crumbs[1]?.href : undefined;
    return section ?? "/admin/pages";
  }, [crumbs]);

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-slate hover:bg-tint lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs items={crumbs} />
        </div>

        <span
          className={cn(
            "hidden shrink-0 items-center gap-1.5 rounded-full border border-warning/30 bg-white px-3 py-1",
            "text-caption font-medium text-warning sm:inline-flex",
          )}
          title="This interface has no authentication. It is excluded from production builds."
        >
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          Local preview — unauthenticated
        </span>

        <Link
          href="/"
          className="hidden shrink-0 items-center gap-1.5 rounded-input px-3 py-2 text-caption font-semibold text-action hover:bg-tint sm:inline-flex"
        >
          View public site
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <form action={target} className="flex items-center gap-2">
        <label htmlFor="admin-search" className="sr-only">
          Search content in this section
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <input
            id="admin-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this section by title or slug"
            className="h-11 w-full rounded-input border border-control bg-white pr-3 pl-9 text-compact text-navy placeholder:text-slate focus-visible:border-action"
          />
        </div>
      </form>
    </header>
  );
}
