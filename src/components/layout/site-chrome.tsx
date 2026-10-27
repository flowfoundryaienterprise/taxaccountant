"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

interface SiteChromeProps {
  /** Rendered on the server and passed down, so this stays a thin client wrapper. */
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Chooses between the public site chrome and a bare shell.
 *
 * The CMS at `/admin` has its own full-height layout — sidebar, admin
 * header, its own `<main>` — and must not be wrapped in the marketing
 * header and footer. Next.js nests every route under the single root
 * layout, and the alternative (splitting the app into `(public)` and
 * `(admin)` route groups with separate root layouts) would mean moving every
 * existing public route, which the Day 6 brief rules out.
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
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
