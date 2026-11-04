export type SubscriptionCategory = "cpa_accountant" | "tax_attorney" | "bookkeeper" | "wealth_advisor";

export interface SubscriptionPlan {
  category: SubscriptionCategory;
  label: string;
  monthlyUsd: number;
}

/**
 * Display copy for the four monthly plans (client-approved brief section
 * 8's table). Mirrors `SUBSCRIPTION_PLANS` in `convex/stripeBilling.ts`
 * exactly — kept as a separate small constant rather than importing that
 * Convex module directly, since it also exports live `query`/`mutation`
 * definitions that have no reason to enter the browser bundle. This is
 * display data only: a checkout session is actually priced by the Stripe
 * Price ID the server resolves for `category`, never by `monthlyUsd`
 * (brief section 8: "Never accept subscription price amounts supplied by
 * the browser").
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { category: "cpa_accountant", label: "CPA / Accountant", monthlyUsd: 299 },
  { category: "tax_attorney", label: "Tax Attorney", monthlyUsd: 299 },
  { category: "bookkeeper", label: "Bookkeeper", monthlyUsd: 199 },
  { category: "wealth_advisor", label: "Wealth Advisor", monthlyUsd: 499 },
];

export const planLabel = (category: SubscriptionCategory | string): string =>
  SUBSCRIPTION_PLANS.find((plan) => plan.category === category)?.label ?? category;
