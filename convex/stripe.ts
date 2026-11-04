import { v } from "convex/values";
import Stripe from "stripe";

import { action, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolvePriceId, type SubscriptionCategory } from "./stripeBilling";

/**
 * The Stripe-SDK half of billing, kept separate from
 * `convex/stripeBilling.ts` for the same reason `devProvision.ts` is its
 * own file: a Convex action cannot touch `ctx.db` directly, so every read
 * or write of `professionalSubscriptions`/`stripeWebhookEvents` here goes
 * through `ctx.runQuery`/`ctx.runMutation` into that file instead.
 *
 * ## No `"use node"`
 * `httpAction`s cannot be defined in a Node (`"use node"`) file at all —
 * confirmed live, `npx convex dev` refuses to push one with "Only actions
 * can be defined in Node.js". `stripeWebhookHandler` below has to be a
 * plain action-runtime `httpAction`, so the whole file (including the two
 * `action`s, for one consistent Stripe client setup) uses the `stripe`
 * SDK's fetch-based HTTP client and Web Crypto-based signature
 * verification instead of its Node defaults — `createFetchHttpClient()`
 * for every API call, `createSubtleCryptoProvider()` +
 * `constructEventAsync` for the webhook, same pattern Stripe documents for
 * Vercel Edge / Cloudflare Workers, which is what Convex's default action
 * runtime actually is under the hood.
 *
 * Every Stripe-side call needs `STRIPE_SECRET_KEY` set on this Convex
 * deployment (`npx convex env set STRIPE_SECRET_KEY ...`), and the webhook
 * additionally needs `STRIPE_WEBHOOK_SECRET`. Neither is set by default —
 * every function below fails with a clear, honest error rather than
 * silently no-opping when its key is missing, so "billing isn't
 * configured yet" is never mistaken for "billing is broken" (brief
 * section 8: "Actual Stripe Price IDs, API keys, webhook secrets... must
 * be supplied and validated before activating real billing" — this file
 * is what validates them).
 */

function requireStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured on this deployment yet (STRIPE_SECRET_KEY is unset).");
  }
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}

const KNOWN_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;
type KnownSubscriptionStatus = (typeof KNOWN_SUBSCRIPTION_STATUSES)[number];

/**
 * Stripe's `Subscription.status` type includes a forward-compatible
 * `OtherString` branch (any string Stripe might add later), which is
 * wider than `professionalSubscriptions.status`'s fixed union. The eight
 * literals above are every status value Stripe documents today, so this
 * only ever throws if Stripe ships a new one — a loud failure instead of
 * silently writing a status the schema doesn't recognize.
 */
function toKnownStatus(status: Stripe.Subscription.Status): KnownSubscriptionStatus {
  if ((KNOWN_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
    return status as KnownSubscriptionStatus;
  }
  throw new Error(`Unrecognized Stripe subscription status: "${status}".`);
}

const CATEGORY_VALIDATOR = v.union(
  v.literal("cpa_accountant"),
  v.literal("tax_attorney"),
  v.literal("bookkeeper"),
  v.literal("wealth_advisor"),
);

/**
 * Starts a Stripe Checkout session for one professional firm's monthly
 * subscription. The price is resolved from this deployment's own env vars
 * (`stripeBilling.resolvePriceId`) keyed by `category` — the client sends
 * only which category it wants, never an amount or a Price ID (brief
 * section 8's "Never accept subscription price amounts supplied by the
 * browser" and "Map professional categories to approved Stripe Price IDs
 * server-side").
 */
export const createCheckoutSession = action({
  args: {
    organizationId: v.id("organizations"),
    category: CATEGORY_VALIDATOR,
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    await ctx.runQuery(internal.stripeBilling.assertBillingRole, {
      organizationId: args.organizationId,
      roles: ["owner", "admin"],
    });

    const priceId = resolvePriceId(args.category as SubscriptionCategory);
    if (!priceId) {
      throw new Error(
        "This professional category doesn't have a Stripe price configured on this deployment yet.",
      );
    }

    const stripe = requireStripeClient();

    const existing = await ctx.runQuery(internal.stripeBilling.getSubscriptionRowInternal, {
      organizationId: args.organizationId,
    });

    const customerId =
      existing?.stripeCustomerId ??
      (
        await stripe.customers.create({
          metadata: { organizationId: args.organizationId },
        })
      ).id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: { organizationId: args.organizationId, category: args.category },
      subscription_data: {
        metadata: { organizationId: args.organizationId, category: args.category },
      },
    });

    await ctx.runMutation(internal.stripeBilling.recordCheckoutStarted, {
      organizationId: args.organizationId,
      category: args.category,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }
    return { url: session.url };
  },
});

/**
 * Opens the Stripe-hosted Customer Portal for an org that already has a
 * Stripe customer — the one place a professional can update payment
 * method, cancel, or view invoices directly through Stripe rather than
 * this app reimplementing any of it (brief section 8: "Professional can
 * access Stripe Customer Portal where configured").
 */
export const createPortalSession = action({
  args: {
    organizationId: v.id("organizations"),
    returnUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    await ctx.runQuery(internal.stripeBilling.assertBillingRole, {
      organizationId: args.organizationId,
      roles: ["owner", "admin"],
    });

    const existing = await ctx.runQuery(internal.stripeBilling.getSubscriptionRowInternal, {
      organizationId: args.organizationId,
    });
    if (!existing) {
      throw new Error("No Stripe customer on record for this organization yet — subscribe first.");
    }

    const stripe = requireStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url: args.returnUrl,
    });
    return { url: portal.url };
  },
});

/**
 * Stripe webhook receiver, registered at `/stripe/webhook` in `http.ts`.
 * Verifies the signature against `STRIPE_WEBHOOK_SECRET` before trusting
 * anything in the body (brief section 8: "Verify webhook signatures") —
 * an unverified or misconfigured request gets a 400/500, never silent
 * success. `recordWebhookEventOnce` is the idempotency guard: a Stripe
 * retry of an already-applied event returns 200 immediately without
 * reprocessing.
 */
export const stripeWebhookHandler = httpAction(async (ctx, request) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret is not configured on this deployment.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header.", { status: 400 });
  }

  const payload = await request.text();
  const stripe = requireStripeClient();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    return new Response(`Invalid signature: ${err instanceof Error ? err.message : String(err)}`, {
      status: 400,
    });
  }

  const { alreadyProcessed } = await ctx.runMutation(internal.stripeBilling.recordWebhookEventOnce, {
    stripeEventId: event.id,
    type: event.type,
  });
  if (alreadyProcessed) {
    return new Response(null, { status: 200 });
  }

  const applySubscription = async (subscription: Stripe.Subscription) => {
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const item = subscription.items.data[0];
    const currentPeriodEnd = item?.current_period_end ?? (subscription as { current_period_end?: number }).current_period_end;
    await ctx.runMutation(internal.stripeBilling.applySubscriptionState, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: typeof item?.price === "string" ? item.price : item?.price?.id,
      status: toKnownStatus(subscription.status),
      currentPeriodEnd: currentPeriodEnd ? currentPeriodEnd * 1000 : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || typeof session.subscription !== "string") break;
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await applySubscription(subscription);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await applySubscription(subscription);
      break;
    }
    case "invoice.payment_failed": {
      // Stripe also fires `customer.subscription.updated` with the new
      // status for a failed-payment subscription in the common
      // (non-trialing, auto-collection) configuration, but this event is
      // handled explicitly too (brief section 8: "Handle failed
      // payments") rather than relying on that firing order.
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscription(subscription);
      }
      break;
    }
    default:
      // Every other event type is intentionally ignored — acknowledging
      // it (200) is still correct so Stripe doesn't keep retrying an
      // event this app has no handling for.
      break;
  }

  return new Response(null, { status: 200 });
});
