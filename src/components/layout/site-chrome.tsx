"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SkipLink } from "@/components/layout/skip-link";

interface SiteChromeProps {
  /** Rendered on the server and passed down, so this stays a thin client wrapper. */
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Chooses between the public site chrome and a bare shell.
 *
 * The CMS at `/admin`, and the signed-in `/customer/dashboard`,
 * `/professional/dashboard` and `/professional/subscription` screens, each
 * have their own full-height layout — a dark sidebar, their own header,
 * their own `<main>` — and must not be wrapped in the marketing header and
 * footer. Next.js nests every route under the single root layout, and the
 * alternative (splitting the app into `(public)` and `(app)` route groups
 * with separate root layouts) would mean moving every existing public
 * route, which the Day 6 brief rules out.
 *
 * Each dashboard-shell route is listed explicitly rather than matched by a
 * `/customer/`/`/professional/` prefix — `/professional/onboarding` lives
 * under the same `/professional/` segment but deliberately keeps the
 * public header/footer (it uses `Container`, not `DashboardShell`), so a
 * prefix match would wrap the wrong one.
 *
 * So the decision is made here instead, in one small client component.
 * `header` and `footer` are rendered on the server by the root layout and
 * passed in as props, so `SiteHeader`/`SiteFooter` remain Server Components
 * and no public markup is pulled into the client bundle.
 *
 * Note that this is a **presentation** decision, not a security boundary.
 * The CMS routes are removed from production builds by the
 * `cms-production-exclusion` plugin in `vite.config.ts`; hiding chrome does
 * not protect anything, and nothing here is relied on for access control.
 */
export function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const pathname = usePathname();
  const isBareShell =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/customer/dashboard" ||
    pathname.startsWith("/customer/dashboard/") ||
    pathname === "/professional/dashboard" ||
    pathname.startsWith("/professional/dashboard/") ||
    pathname === "/professional/subscription" ||
    pathname.startsWith("/professional/subscription/");

  if (isBareShell) return <>{children}</>;

  return (
    <>
      {/* First focusable element in the document, so a keyboard user can
          jump the header on every page. */}
      <SkipLink />
      {header}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {footer}
    </>
  );
}
