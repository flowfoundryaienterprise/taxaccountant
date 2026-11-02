import { ConvexHttpClient } from "convex/browser";

/**
 * A Convex client for **unauthenticated, public** server-side reads —
 * `/resources` and `/resources/[slug]` calling `content:listPublishedResources`
 * / `content:getPublishedBySlug`. Those queries filter to `status:
 * "published"` themselves (`convex/content.ts`), so no session is needed
 * here and none is attached: this is a plain `ConvexHttpClient`, never
 * `fetchAuthQuery` (`@/lib/auth/server`), which exists specifically for the
 * *authenticated* staff reads under `/admin`.
 *
 * One client per request would also work, but Convex's own docs note
 * `ConvexHttpClient` is cheap to hold onto — a module-level singleton avoids
 * re-parsing the deployment URL on every request.
 */
export const publicConvexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
