import { v } from "convex/values";

import { query } from "./_generated/server";

/**
 * Minimal public professional-directory query — a prerequisite Task 5's
 * design doc assumed already existed but doesn't (Phase 2, P2-W2 plan,
 * task-5-brief.md). Exists so `requestProfessionalClaim` (convex/
 * professionalOwnership.ts) has a published professional to find and claim,
 * via a search surface a real "claim an existing listing" UI (Task 7) can
 * call directly.
 */

const MAX_CANDIDATES_SCANNED = 200;
const MAX_RESULTS = 20;

/**
 * Substring-matches `nameQuery` against `displayName`/`firmName`, scoped to
 * published listings only via the `by_publication_status` index. Bounded on
 * both ends: `.take(MAX_CANDIDATES_SCANNED)` keeps the index scan itself
 * bounded (never an unbounded `.collect()` over every published
 * professional), and the substring filter that runs over those candidates is
 * capped to `MAX_RESULTS` matches. The published-professional directory is
 * expected to stay small relative to this bound (AGENTS.md); it is not a
 * general full-text search over an unbounded table.
 */
export const searchPublishedProfessionals = query({
  args: { nameQuery: v.string() },
  handler: async (ctx, args) => {
    const needle = args.nameQuery.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    const candidates = await ctx.db
      .query("professionals")
      .withIndex("by_publication_status", (q) => q.eq("publicationStatus", "published"))
      .take(MAX_CANDIDATES_SCANNED);

    const matches = candidates.filter((professional) => {
      const displayName = professional.displayName.toLowerCase();
      const firmName = professional.firmName?.toLowerCase() ?? "";
      return displayName.includes(needle) || firmName.includes(needle);
    });

    return matches.slice(0, MAX_RESULTS).map((professional) => ({
      professionalId: professional._id,
      displayName: professional.displayName,
      firmName: professional.firmName,
      slug: professional.slug,
    }));
  },
});
