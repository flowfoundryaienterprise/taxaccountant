"use client";

import * as React from "react";
import { useAction, useQuery } from "convex/react";
import { CreditCard, ExternalLink } from "lucide-react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/admin/admin-formatters";
import { SUBSCRIPTION_PLANS, type SubscriptionCategory } from "@/lib/marketplace/subscription-plans";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface SubscriptionPanelProps {
  organizationId: Id<"organizations">;
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * The interactive half of `/professional/subscription` — plan selection,
 * "Subscribe" (Stripe Checkout) and "Manage subscription" (Stripe Customer
 * Portal). A Client Component because both actions open a real Stripe-
 * hosted redirect via `window.location.assign`, and the subscription row
 * itself is read reactively (`useQuery`) so a webhook-driven status change
 * shows up without a manual refresh.
 *
 * Prices shown are `SUBSCRIPTION_PLANS` (`@/lib/marketplace/subscription-plans`)
 * display data only — the actual checkout is priced server-side from
 * `category` alone (`convex/stripe.ts`'s `createCheckoutSession`), never
 * from anything sent by this component (brief section 8: "Never accept
 * subscription price amounts supplied by the browser").
 */
export function SubscriptionPanel({ organizationId }: SubscriptionPanelProps) {
  const subscription = useQuery(api.stripeBilling.mySubscription, { organizationId });
  const availability = useQuery(api.stripeBilling.billingAvailability, {});
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const [selectedCategory, setSelectedCategory] = React.useState<SubscriptionCategory | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const category = selectedCategory ?? subscription?.category ?? null;
  const isSubscribed = Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));

  async function handleSubscribe() {
    if (!category) return;
    setPending(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const result = await createCheckoutSession({
        organizationId,
        category,
        successUrl: `${origin}/professional/subscription?checkout=success`,
        cancelUrl: `${origin}/professional/subscription?checkout=cancelled`,
      });
      window.location.assign(result.url);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    }
  }

  async function handleManage() {
    setPending(true);
    setError(null);
    try {
      const result = await createPortalSession({
        organizationId,
        returnUrl: `${window.location.origin}/professional/subscription`,
      });
      window.location.assign(result.url);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Could not open the billing portal.");
    }
  }

  if (subscription === undefined || availability === undefined) {
    return (
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
        <div className="h-5 w-40 animate-pulse-soft rounded bg-subtle" />
        <div className="h-20 animate-pulse-soft rounded bg-subtle" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {subscription ? (
        <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-compact font-semibold text-navy">Current plan</h2>
            <AdminStatusBadge status={subscription.status} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <p className="text-caption text-slate">Plan</p>
              <p className="text-compact font-medium text-navy">
                {subscription.category
                  ? SUBSCRIPTION_PLANS.find((plan) => plan.category === subscription.category)?.label
                  : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-caption text-slate">Monthly price</p>
              <p className="font-mono text-compact font-medium text-navy">
                {subscription.category
                  ? `$${SUBSCRIPTION_PLANS.find((plan) => plan.category === subscription.category)?.monthlyUsd}`
                  : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-caption text-slate">
                {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}
              </p>
              <p className="font-mono text-compact font-medium text-navy">
                {subscription.currentPeriodEnd
                  ? (formatDate(new Date(subscription.currentPeriodEnd).toISOString()) ?? "—")
                  : "—"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManage}
            disabled={pending}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {pending ? "Opening…" : "Manage subscription"}
          </button>
        </div>
      ) : null}

      {!isSubscribed ? (
        <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-6 shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]">
          <div className="flex flex-col gap-1">
            <h2 className="text-compact font-semibold text-navy">
              {subscription ? "Resubscribe" : "Choose a plan"}
            </h2>
            <p className="text-caption text-slate">
              One plan per professional firm, billed monthly through Stripe.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const available = availability[plan.category];
              const selected = category === plan.category;
              return (
                <button
                  key={plan.category}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedCategory(plan.category)}
                  className={cn(
                    "flex flex-col gap-1 rounded-card border p-4 text-left transition-colors duration-150",
                    !available
                      ? "cursor-not-allowed border-border bg-subtle opacity-60"
                      : selected
                        ? "border-action bg-tint"
                        : "border-border bg-white hover:border-action",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-compact font-medium text-navy">{plan.label}</span>
                    {!available ? (
                      <span className="text-caption text-slate">Not yet available</span>
                    ) : null}
                  </span>
                  <span className="font-mono text-heading-sm font-semibold text-navy">
                    ${plan.monthlyUsd}
                    <span className="text-caption font-normal text-slate"> / month</span>
                  </span>
                </button>
              );
            })}
          </div>

          {error ? (
            <p role="alert" className="text-caption font-medium text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={pending || !category || !availability[category]}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-fit")}
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {pending ? "Starting checkout…" : "Subscribe"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
