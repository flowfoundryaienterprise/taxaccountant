import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";

/**
 * CMS layout.
 *
 * ## Access
 * DAY6_ADMIN_CMS.md section 1 required three things before `/admin` could
 * ever be enabled in a deployed environment: (1) server-side authentication,
 * (2) a staff role check derived server-side from the session, (3)
 * authorized Convex queries enforcing the public/private boundary in the
 * query itself. This layout is (1) and (2) — the one place every `/admin`
 * request passes through before any child route renders.
 *
 * `isAuthenticated()` and `fetchAuthQuery()` (`@/lib/auth/server`) read the
 * session cookie via vinext's `next/headers` shim and call Convex directly
 * from this Server Component, so an unauthenticated or non-staff request
 * never receives the RSC payload for any admin screen — not a client-side
 * check that hides already-sent markup. `staff:currentStaff`
 * (`convex/staff.ts`) returns `null` for anyone without an **active**
 * `staffMemberships` row, so a stray Better Auth account grants nothing by
 * itself (ARCHITECTURE.md section 6).
 *
 * Redirects to `/sign-in`, the one shared login for every signed-in area
 * of the site — not a separate staff-only page. `AccountAuthForm`
 * (`@/components/shared/account-auth-form`) already redirects a staff
 * sign-in to `/admin` on its own and handles the `reason=not-staff` state
 * below; see its own comment for why no second page is needed.
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
   * Hard `noindex, nofollow` on every CMS route — a login-gated interface
   * has nothing for a crawler to index, and no CMS URL should leak into a
   * search index through a followed link.
   */
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=admin-dashboard");
  }

  const staff = await fetchAuthQuery(api.staff.currentStaff, {});
  if (!staff) {
    redirect("/sign-in?intent=admin-dashboard&reason=not-staff");
  }

  return <AdminShell staffRole={staff.role}>{children}</AdminShell>;
}
