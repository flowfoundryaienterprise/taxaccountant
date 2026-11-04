import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { stripeWebhookHandler } from "./stripe";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

/**
 * Stripe sends this deployment's own `*.convex.site` URL plus
 * `/stripe/webhook` — configured on the Stripe dashboard (or `stripe
 * listen --forward-to` locally), not something this app constructs.
 * `stripeWebhookHandler` (`convex/stripeNode.ts`) verifies the signature
 * before trusting anything in the body.
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhookHandler,
});

export default http;
