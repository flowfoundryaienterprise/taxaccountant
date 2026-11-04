import { EnquiryInbox } from "@/components/dashboard/enquiry-inbox";
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

  if (!user || user.accountStatus !== "active") {
    redirect("/sign-in?intent=professional-dashboard");
  }

  if (user.role !== "professional") redirect("/customer/dashboard");

  const profiles = await fetchAuthQuery(api.professionalOwnership.myProfiles, {});
  if (!profiles.some(profile => profile.publicationStatus === "review" || profile.publicationStatus === "published")) redirect("/professional/onboarding");

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
          description="Manage your profile, review status and subscription."
          actions={
            <Link
              href="/professional/profile"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              My profile
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard
            label="Profile review"
            value={profiles[0].publicationStatus === "review" ? "Pending review" : statusLabel(profiles[0].publicationStatus)}
            caption="Only approved profiles are published"
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

        {profiles.map(profile => <div key={profile._id}><h2 className="mb-3 font-semibold">{profile.displayName}</h2><EnquiryInbox professionalId={profile._id} /></div>)}
      </div>
    </DashboardShell>
  );
}
