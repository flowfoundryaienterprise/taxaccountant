import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { formatDate, pluralize } from "@/lib/admin/admin-formatters";
import { SUBSCRIPTION_PLANS, planLabel } from "@/lib/marketplace/subscription-plans";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";

export const metadata: Metadata = {
  title: "Subscriptions",
};

interface SubscriptionRow {
  _id: string;
  organizationName: string;
  category?: string;
  status: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  updatedAt: number;
}

/**
 * `/admin/subscriptions` — every `professionalSubscriptions` row (brief
 * section 8: "Admin dashboard displays subscription records"). Read-only:
 * status, renewal date and cancellation state come entirely from Stripe's
 * own webhook events (`convex/stripe.ts`), and this screen deliberately
 * has no control that could set `status` directly — "Do not allow
 * arbitrary changes to payment status that conflict with Stripe" (brief
 * section 10).
 *
 * MRR is a real sum over rows this screen can see (active/trialing
 * subscriptions' list price), not an estimate — if Stripe billing isn't
 * configured on this deployment, or nobody has subscribed yet, it reads
 * $0 rather than a placeholder number.
 */
export default async function AdminSubscriptionsPage() {
  const rows = await fetchAuthQuery(api.stripeBilling.adminListSubscriptions, {});

  const active = rows.filter((row) => row.status === "active" || row.status === "trialing");
  const pastDue = rows.filter((row) => row.status === "past_due" || row.status === "unpaid");
  const monthlyRecurringUsd = active.reduce((sum, row) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.category === row.category);
    return plan ? sum + plan.monthlyUsd : sum;
  }, 0);

  const columns: AdminColumn<SubscriptionRow>[] = [
    {
      key: "organization",
      header: "Professional firm",
      render: (row) => <span className="font-medium text-navy">{row.organizationName}</span>,
    },
    {
      key: "category",
      header: "Plan",
      hideOnMobile: true,
      render: (row) => (row.category ? planLabel(row.category) : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <AdminStatusBadge status={row.status} />
          {row.cancelAtPeriodEnd ? (
            <span className="text-caption text-slate">Cancels at period end</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "renews",
      header: "Renews / ends",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono tabular-nums">
          {row.currentPeriodEnd ? (formatDate(new Date(row.currentPeriodEnd).toISOString()) ?? "—") : "—"}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Last updated",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono tabular-nums">{formatDate(new Date(row.updatedAt).toISOString()) ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Subscriptions"
        description="Stripe monthly billing records for professional firms. Status and renewal dates come from Stripe's own webhook events."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Active subscribers"
          value={active.length}
          caption={`of ${rows.length} subscription ${pluralize(rows.length, "record").split(" ")[1]}`}
        />
        <AdminStatCard
          label="Monthly recurring revenue"
          value={`$${monthlyRecurringUsd.toLocaleString("en-US")}`}
          caption="Sum of active/trialing plan prices"
        />
        <AdminStatCard
          label="Past due or unpaid"
          value={pastDue.length}
          caption="Needs the professional's attention in Stripe"
        />
      </div>

      <AdminDataTable
        caption="Professional firm subscriptions"
        columns={columns}
        rows={rows}
        rowKey={(row) => row._id}
        empty={
          <AdminEmptyState
            icon={CreditCard}
            title="No subscriptions yet"
            description="Records appear here once a professional firm subscribes through Stripe Checkout."
          />
        }
      />
    </div>
  );
}
