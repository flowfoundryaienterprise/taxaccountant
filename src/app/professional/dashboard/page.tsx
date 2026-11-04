import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { statusLabel } from "@/lib/admin/admin-formatters";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Professional dashboard",
  robots: { index: false, follow: true },
};

/**
 * `/professional/dashboard` — the signed-in professional's overview, same
 * dark-sidebar/stat-card layout as the CMS dashboard and
 * `/customer/dashboard` (one design system for every signed-in area, per
 * explicit request).
 *
 * "My Profile" routes to `/professional/onboarding` — the real Phase 2
 * wizard (`createProfessionalDraft`/`requestProfessionalClaim`,
 * `convex/professionalOwnership.ts`) that creates or claims a listing,
 * since that is genuinely where profile editing lives today. Lead inbox
 * and notifications have no backing table yet, so they render locked in
 * the sidebar rather than linking to a page with nothing behind it.
 * Subscription is live (brief section 8) — `/professional/subscription`,
 * Stripe Checkout and Customer Portal via `convex/stripe.ts`.
 *
 * This page provisions its own `appUsers` row
 * (`fetchAuthMutation(ensureAppUser, { role: "professional" })`) rather
 * than relying on `EnsureAppUser` having already run — see the identical
 * comment on `/customer/dashboard` for the race that caused and why this
 * fixes it. `ensureAppUser` only sets `role` on the row's creation, so this
 * is a no-op for an existing professional and never overwrites a
 * `customer` role on an account reached here by mistake.
 */
export default async function ProfessionalDashboardPage() {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=professional-dashboard");
  }

  await fetchAuthMutation(api.users.ensureAppUser, { role: "professional" });

  const [user, organizations] = await Promise.all([
    fetchAuthQuery(api.users.currentUser, {}),
    fetchAuthQuery(api.organizations.currentOrganizations, {}),
  ]);

  if (!user) {
    redirect("/sign-in?intent=professional-dashboard");
  }

  const accountLabel = user.displayName ?? user.email ?? "Your account";
  const firms = organizations.filter((org) => org.kind === "professional_firm");
  const subscription = firms[0]
    ? await fetchAuthQuery(api.stripeBilling.mySubscription, { organizationId: firms[0].organizationId })
    : null;

  return (
    <DashboardShell
      eyebrow="Professional console"
      title="Dashboard"
      accountLabel={accountLabel}
      variant="professional"
    >
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={`Welcome back${user.displayName ? `, ${user.displayName}` : ""}`}
          description="Create or claim your listing, and track its review status once it's submitted."
          actions={
            <Link
              href="/professional/onboarding"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              List your practice
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
            label="Firms"
            value={firms.length}
            caption={firms.length === 1 ? "professional firm you belong to" : "professional firms you belong to"}
            href={firms[0] ? `/organization/${firms[0].organizationId}` : "/organization/new"}
          />
          <AdminStatCard
            label="Subscription"
            value={subscription ? statusLabel(subscription.status) : "None"}
            caption={subscription ? "See the Subscription tab for billing details" : "Not subscribed yet"}
            href="/professional/subscription"
          />
        </div>

        {firms.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">Your firms</h2>
            <ul className="flex flex-col gap-1">
              {firms.map((org) => (
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
        ) : (
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">No professional firm yet</h2>
            <p className="text-compact text-slate">
              Create a professional firm from the onboarding wizard before you can list a practice.
            </p>
            <Link
              href="/organization/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
            >
              Create a firm
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-tint p-6">
          <h2 className="text-compact font-semibold text-navy">What's not live yet</h2>
          <p className="text-compact text-slate">
            Lead inbox and notifications don't have a backing record in Convex yet — this is Phase
            4 work (lead routing), so that panel appears once it ships rather than showing invented
            activity now. Subscription billing is live — see the Subscription tab.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
