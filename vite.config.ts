import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

/**
 * The Day 6 `cms-production-exclusion` build-time stub (replacing every
 * module under `src/app/admin/` with a `notFound()` stub unless
 * `CMS_PREVIEW=enabled`) is removed as of the staff-auth pass. It existed
 * because, verified Day 6, there was no authentication anywhere in the
 * project — "Do not deploy an unprotected admin dashboard" (DAY6_ADMIN_CMS.md
 * section 1) had to be satisfied by keeping the CMS out of the production
 * bundle entirely, since there was nothing else to protect it with.
 *
 * That prerequisite is now met: `/admin` is gated by real server-side
 * authentication and a role check, both evaluated before any admin markup
 * is sent.
 *   - `src/app/admin/layout.tsx` calls `isAuthenticated()` and
 *     `fetchAuthQuery(api.staff.currentStaff, {})` (`@/lib/auth/server`,
 *     reading the session cookie via vinext's `next/headers` shim) and
 *     redirects to `/staff-login` on either an unauthenticated request or
 *     an authenticated one with no active `staffMemberships` row — a
 *     Server Component check, not a client-side one a bundle inspection
 *     could bypass.
 *   - Identity and credentials live in the Better Auth component
 *     (`convex/auth.ts`, `convex/convex.config.ts`); role is looked up
 *     separately in `staffMemberships`, keyed by `identity.tokenIdentifier`
 *     (`convex/staff.ts`), so a Better Auth account alone grants nothing.
 *
 * What this does NOT yet satisfy, from the same DAY6_ADMIN_CMS.md
 * checklist: "Authorized Convex queries that enforce the public/private
 * boundary in the query" and "An audit event on every write". Every admin
 * screen today still reads from the same static fixtures/catalog
 * projections it always has (`src/lib/admin/**`) rather than real `cms:*`
 * Convex queries, and every save/publish/delete control is still disabled
 * — so there is nothing to audit yet. The auth gate controls who can reach
 * the screens; it does not retroactively make the screens read or write
 * authorized data, because none of that exists yet. See `convex/staff.ts`'s
 * `requireStaff` for the helper future `cms:*` functions should use.
 */
export default defineConfig({
  plugins: [
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  server: {
    /*
     * Vite blocks requests carrying an unrecognized `Host` header by
     * default (DNS-rebinding protection) — necessary when tunneling the dev
     * server (e.g. `cloudflared tunnel --url http://localhost:5173` for a
     * client demo link) through a hostname Vite has never seen. Each quick
     * tunnel gets a fresh random `*.trycloudflare.com` subdomain, so the
     * wildcard is allowed rather than one specific hostname that would stop
     * working the moment the tunnel restarts. Dev-server-only setting; has
     * no effect on the production Worker build.
     */
    allowedHosts: [".trycloudflare.com"],
  },
});
