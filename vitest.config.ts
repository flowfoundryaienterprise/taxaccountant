import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    // `convex/auth.ts` reads `SITE_URL` at module load time and throws if it
    // is unset (a deliberate guard against a misconfigured real deployment).
    // Functions running inside convex-test's edge-runtime sandbox read
    // through to this (the real Vitest process's) `process.env`, so the test
    // run needs a value here — it is never used to issue a real session.
    //
    // `CONVEX_SITE_URL` is normally platform-provided in a real deployment
    // (it's what `convex/staff.ts`'s `buildAuthSubject` combines with a
    // Better Auth user id to build `tokenIdentifier`-shaped `authSubject`
    // values); convex-test's sandbox never sets it, so it's pinned here to
    // the same literal every test's `t.withIdentity({ issuer: ... })` calls
    // already use, so a real Better Auth session simulated via
    // `withIdentity({ subject: betterAuthUserId, issuer: "https://example.convex.site" })`
    // produces a `tokenIdentifier` that matches what `buildAuthSubject` computes.
    env: {
      SITE_URL: "http://localhost:3000",
      CONVEX_SITE_URL: "https://example.convex.site",
    },
  },
});
