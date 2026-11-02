import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

/*
 * Staff-only identity provider for the CMS (ARCHITECTURE.md section 6,
 * DAY6_ADMIN_CMS.md section 1 blocker #1). Identity/session/credential
 * storage lives entirely in this component's own tables; `role` is looked
 * up separately in `staffMemberships` (see `convex/staff.ts`) keyed by
 * `identity.tokenIdentifier` — never trust a client-supplied role or
 * subject (AGENTS.md section 5/6).
 *
 * `emailAndPassword` is enabled because Phase 1 staff accounts are
 * provisioned directly, not self-registered (ARCHITECTURE.md section 6):
 * having a Better Auth account is necessary but not sufficient to reach
 * `/admin` — `requireStaff` in `convex/staff.ts` additionally requires an
 * `active` `staffMemberships` row, so a stray sign-up through this
 * provider grants no CMS access on its own.
 */
const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  throw new Error(
    "SITE_URL is not set on this Convex deployment. Run `npx convex env set SITE_URL <url>` " +
      "(see convex/auth.ts) before the Better Auth component can issue correctly-scoped sessions.",
  );
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
};
