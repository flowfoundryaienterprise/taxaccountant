import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

/*
 * The one identity provider for the whole app — staff and public
 * customers/professionals alike. Identity/session/credential storage lives
 * entirely in this component's own tables; *role* is always looked up
 * separately, keyed by `identity.tokenIdentifier`, never trusted from a
 * client-supplied value (AGENTS.md section 5/6):
 *  - `staffMemberships` (`convex/staff.ts`) — CMS access, admin-provisioned
 *    only (ARCHITECTURE.md section 6, DAY6_ADMIN_CMS.md section 1).
 *  - `appUsers` (`convex/users.ts`) — public account, self-registered,
 *    auto-created on first sign-in (Phase 2, P2-W1, DATABASE.md section 3).
 *
 * `emailAndPassword` is the only method enabled (PRD.md's phase gates: no
 * OAuth/social sign-in has been approved). Having a Better Auth account is
 * necessary but never sufficient for anything privileged on its own — a
 * stray sign-up grants no CMS access without a `staffMemberships` row, and
 * grants only an ordinary customer `appUsers` row otherwise.
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
