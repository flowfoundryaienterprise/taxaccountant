import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/**
 * Server-side Better Auth/Convex helpers, used to read the session cookie
 * during SSR (via vinext's `next/headers` shim) and to check or fetch
 * authorized data for a Server Component before it ever renders — the
 * actual security boundary DAY6_ADMIN_CMS.md requires ("server-side
 * authentication... derived server-side from the session"), not a
 * client-side redirect after the fact.
 */
export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
