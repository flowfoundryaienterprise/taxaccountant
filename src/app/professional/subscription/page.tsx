import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SubscriptionPanel } from "@/components/professional/subscription-panel";
import { buttonVariants } from "@/components/ui/button";
import { fetchAuthMutation, fetchAuthQuery, isAuthenticated } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Subscription",
  robots: { index: false, follow: true },
};

/**
 * `/professional/subscription` — brief section 8's monthly billing
 * screen: pick a professional category, see its price, start Stripe
 * Checkout; once subscribed, see status and open the Stripe Customer
 * Portal.
 *
 * Server-rendered shell only picks which `professional_firm` organization
 * this is for (the first one the signed-in account belongs to, same
 * source as `/professional/dashboard`'s "Firms" stat) — the subscription
 * row itself, plan selection, and both Stripe redirects live in
 * `SubscriptionPanel` (`@/components/professional/subscription-panel`), a
 * Client Component, since both actions it calls
 * (`createCheckoutSession`/`createPortalSession`,
 * `convex/stripe.ts`) need a real browser redirect to Stripe.
 */
export default async function ProfessionalSubscriptionPage() {
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
  const firm = organizations.find((org) => org.kind === "professional_firm");

  return (
    <DashboardShell
      eyebrow="Professional console"
      title="Subscription"
      accountLabel={accountLabel}
      variant="professional"
    >
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Subscription"
          description="Monthly billing for your professional listing, through Stripe."
        />

        {firm ? (
          <SubscriptionPanel organizationId={firm.organizationId} />
        ) : (
          <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
            <h2 className="text-compact font-semibold text-navy">No professional firm yet</h2>
            <p className="text-compact text-slate">
              Create a professional firm before subscribing — a subscription belongs to the firm,
              not to your personal account.
            </p>
            <Link
              href="/organization/new"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
            >
              Create a firm
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
