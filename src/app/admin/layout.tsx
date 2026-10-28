import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";

/**
 * CMS layout.
 *
 * ## Access
 * This route subtree has **no authentication**. It is kept out of deployed
 * environments by the `cms-production-exclusion` plugin in
 * `vite.config.ts`, which replaces every module under `src/app/admin/` with
 * a `notFound()` stub unless the build or dev command is run with
 * `CMS_PREVIEW=enabled`. With the flag unset no CMS code, markup or fixture
 * data is present in the bundle at all and `/admin` returns 404.
 *
 * That is a build-time gate, not authorization. Before this interface may be
 * enabled in any deployed environment it needs server-side authentication,
 * staff role checks, and authorized Convex queries that enforce the
 * public/private boundary on the server rather than in the browser. The
 * required contracts are listed in docs/DAY6_ADMIN_CMS.md.
 *
 * ## Why there is no `<main>` here
 * `AdminShell` renders its own `<main>`, and the root layout steps aside for
 * `/admin` via `SiteChrome`, so the page has exactly one main landmark and
 * no public header or footer.
 */
export const metadata: Metadata = {
  title: {
    default: "Content Management",
    template: "%s | TaxAccountant.com CMS",
  },
  /*
   * Hard `noindex, nofollow` on every CMS route. These pages never reach
   * production, but if one is ever served by a preview deployment it must
   * not be crawled, and no CMS URL should leak into an index through a
   * followed link.
   */
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
