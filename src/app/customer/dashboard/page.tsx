import { EnquiryInbox } from "@/components/dashboard/enquiry-inbox";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, UserRound } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your dashboard",
  robots: { index: false, follow: true },
};

/**
 * `/customer/dashboard` — the signed-in customer's overview, in the same
 * dark-sidebar/stat-card layout as the CMS dashboard (`@/app/admin/page.tsx`)
 * on explicit request that every signed-in area share one design system.
 *
 * Unlike the CMS overview there is no fixture catalogue to fall back on
 * here: enquiries, saved professionals and notifications have no Convex
 * table yet (see `DashboardNavItem.available`), so those panels say so
 * plainly instead of inventing rows. Account identity and organization
 * membership are real `appUsers`/`organizationMembers` reads
 * (`convex/users.ts`, `convex/organizations.ts`), the same Phase 2 data
 * `/organization/[id]` already reads.
 *
 * ## Why this page provisions its own `appUsers` row
 * `fetchAuthMutation(ensureAppUser, { role: "customer" })` runs here,
 * before reading `currentUser` — not left to `EnsureAppUser`
 * (`@/components/shared/ensure-app-user`), the client component that
 * provisions the row for every other authenticated screen. Confirmed live:
 * a brand-new sign-up redirects straight to this page
 * (`AccountAuthForm`), and `EnsureAppUser`'s effect — mounted once,
 * elsewhere in the tree — hadn't necessarily finished creating the row by
 * the time this page's first server render asked `currentUser` for it,
 * which read `null` and bounced a person who had, in fact, just signed up,
 * straight back to `/sign-in`. `ensureAppUser` is idempotent (it only sets
 * fields on the row's *creation*; see that mutation's comment), so calling
 * it again here for an existing customer is a harmless no-op that returns
 * the row unchanged — it never overwrites a `role` an account already has,
 * including a `professional` one reached here by mistake.
 */
export default async function CustomerDashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=customer-dashboard");
  }

  await fetchAuthMutation(api.users.ensureAppUser, { role: "customer" });

  const [user, organizations] = await Promise.all([
    fetchAuthQuery(api.users.currentUser, {}),
    fetchAuthQuery(api.organizations.currentOrganizations, {}),
  ]);

  if (!user || user.accountStatus !== "active") {
    redirect("/sign-in?intent=customer-dashboard");
  }

  if (user.role !== "customer") redirect("/professional/dashboard");

  const accountLabel = user.displayName ?? user.email ?? "Your account";

  return (
    <DashboardShell
      eyebrow="Customer account"
      title="Dashboard"
      accountLabel={accountLabel}
      variant="customer"
    >
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={`Welcome back${user.displayName ? `, ${user.displayName}` : ""}`}
          description="Find a professional and manage your enquiries."
          actions={
            <Link href="/find-accountant" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              <Search className="h-4 w-4" aria-hidden />
              Find a professional
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard
            label="Account status"
            value={user.accountStatus === "active" ? "Active" : user.accountStatus}
            caption="From your TaxAccountant.com account"
          />
          <AdminStatCard
            label="Organizations"
            value={organizations.length}
            caption={organizations.length === 1 ? "business you belong to" : "businesses you belong to"}
            href={organizations[0] ? `/organization/${organizations[0].organizationId}` : "/organization/new"}
          />
          <AdminStatCard label="Enquiries" value="View inbox" caption="Your latest submissions and their status" href="#enquiries" />
        </div>

        {organizations.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">Your organizations</h2>
            <ul className="flex flex-col gap-1">
              {organizations.map((org) => (
                <li key={org.organizationId}>
                  <Link
                    href={`/organization/${org.organizationId}`}
                    className="flex items-center justify-between gap-3 rounded-[0.625rem] px-2.5 py-2.5 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle"
                  >
                    <span className="flex items-center gap-2.5">
                      <UserRound className="h-4 w-4 text-action" aria-hidden />
                      {org.name}
                    </span>
                    <span className="text-caption text-slate capitalize">{org.role}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <EnquiryInbox />
      </div>
    </DashboardShell>
  );
}
