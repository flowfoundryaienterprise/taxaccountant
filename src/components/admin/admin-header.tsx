"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Menu, Search } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { authClient } from "@/lib/auth/client";
import { adminBreadcrumbs } from "@/lib/admin/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  pathname: string;
  staffRole: "cms_admin" | "cms_editor";
  onOpenSidebar: () => void;
  /** Replaces the final breadcrumb with a record title instead of its id. */
  lastCrumbLabel?: string;
}

const ROLE_LABEL: Record<AdminHeaderProps["staffRole"], string> = {
  cms_admin: "Admin",
  cms_editor: "Editor",
};

/**
 * CMS top bar: sidebar toggle, breadcrumbs, content search, account area.
 *
 * ## The account area
 * Previously a "Local preview — unauthenticated" warning, because no
 * authentication existed anywhere in the project. Now that `/admin/layout.tsx`
 * resolves a real, server-verified `staffRole` before this component ever
 * renders (`convex/staff.ts`'s `currentStaff`, checked against the Better
 * Auth session), showing it is reporting a real fact rather than the
 * fiction the brief originally ruled out ("Signed in as Admin" with nothing
 * behind it) — see docs/DAY6_ADMIN_CMS.md section 1.
 */
export function AdminHeader({ pathname, staffRole, onOpenSidebar, lastCrumbLabel }: AdminHeaderProps) {
  const [query, setQuery] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);
  const router = useRouter();
  const crumbs = adminBreadcrumbs(pathname, lastCrumbLabel);

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/staff-login");
    router.refresh();
  }

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
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-slate hover:bg-subtle lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs items={crumbs} />
        </div>

        <span
          className={cn(
            "hidden shrink-0 items-center gap-2 rounded-full border border-border bg-subtle px-3 py-1",
            "text-caption font-medium text-navy sm:inline-flex",
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
          {ROLE_LABEL[staffRole]}
        </span>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="hidden shrink-0 items-center gap-1.5 rounded-input px-3 py-2 text-caption font-medium text-slate transition-colors duration-150 hover:bg-subtle disabled:opacity-50 sm:inline-flex"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>

        {/*
          Always visible, every screen size — previously `hidden sm:inline-flex`,
          so a signed-in staff member on a phone had no way back to the
          public site short of editing the URL. Icon-only below `sm:` to fit
          the header row next to the hamburger toggle and search; full label
          once there's room.
        */}
        <Link
          href="/"
          aria-label="View public site"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-input border border-border px-2.5 py-2 text-caption font-medium text-action transition-colors duration-150 hover:bg-subtle sm:px-3"
        >
          <span className="hidden sm:inline">View public site</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
