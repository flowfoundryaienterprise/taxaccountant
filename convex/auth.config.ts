import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

/**
 * JWT provider for `ctx.auth.getUserIdentity()`. Without this file the
 * identity is always `null` and every `requireStaff`-style check would
 * silently "fail closed" for everyone, staff included — see the Convex
 * guidelines' Authentication section. `getAuthConfigProvider()` points at
 * the Better Auth component mounted in `convex.config.ts`, which issues and
 * verifies its own tokens.
 */
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
