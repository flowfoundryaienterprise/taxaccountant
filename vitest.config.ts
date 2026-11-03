/// <reference types="vitest/config" />
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
    env: {
      SITE_URL: "http://localhost:3000",
    },
  },
});
