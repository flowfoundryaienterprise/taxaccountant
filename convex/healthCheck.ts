import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Minimal public, read-only smoke-test query (AGENTS.md Task G). Returns no
 * user data and touches no table, so it has nothing to do with seed data —
 * it only confirms the deployment is reachable and functions execute.
 */
export const status = query({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    serverTime: v.number(),
  }),
  handler: async () => {
    return {
      ok: true,
      serverTime: Date.now(),
    };
  },
});
