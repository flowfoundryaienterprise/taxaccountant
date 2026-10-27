import type { ProfessionalProfile } from "@/lib/professionals/profile-types";

/**
 * CMS-ONLY development fixtures: professional records that are **not**
 * publicly visible.
 *
 * ## Why these live here and not with the published fixtures
 * They were originally in `@/lib/professionals/profile-fixtures`, sitting in
 * the same lookup map the public profile route reads, so that the
 * publication gate would be the thing rejecting them. A Day 6 audit of the
 * production bundle showed the cost of that: both records were being
 * compiled into the deployed Worker, because a public module had to carry
 * them in order for the gate to see them.
 *
 * Unapproved records must not be in a public module at all. The strongest
 * form of "unpublished profiles are inaccessible" is that the public side
 * never holds them in the first place, so they moved here — a module only
 * the CMS imports, and the CMS is stripped from production builds entirely
 * by `cms-production-exclusion` in `vite.config.ts`.
 *
 * The publication gate in `getPublishedProfile` is unchanged and still runs
 * on every public lookup; it is what will reject draft and suspended rows
 * once `professionals:getPublishedBySlug` serves real data. That check must
 * also be enforced **server-side** in the query itself — a frontend filter
 * is not an access control.
 *
 * An internal content-management view is the one place these rows belong:
 * reviewing what is not yet published is the entire point of a publication
 * workflow.
 */
export const unpublishedProfileFixtures: ProfessionalProfile[] = [
  {
    slug: "atlas-fiscal-group",
    displayName: "Atlas Fiscal Group",
    kind: "firm",
    firmName: "Atlas Fiscal Group",
    bio: [],
    // Never approved for publication, so it fails the approval gate as well
    // as the publication gate.
    approvedProfile: false,
    verificationStatus: "not_reviewed",
    publicationStatus: "draft",
    remoteServices: true,
    publicContactMode: "none",
    featured: false,
    locations: [{ countryCode: "US", city: "Chicago", isPrimary: true }],
    services: [],
    languageCodes: ["en"],
    credentials: [],
  },
  {
    slug: "helena-fischer",
    displayName: "Helena Fischer",
    kind: "individual",
    bio: [],
    // Approved once, then suspended — so this row proves the publication
    // gate matters independently of the approval flag.
    approvedProfile: true,
    verificationStatus: "not_reviewed",
    publicationStatus: "suspended",
    remoteServices: true,
    publicContactMode: "none",
    featured: false,
    locations: [{ countryCode: "DE", city: "Hamburg", isPrimary: true }],
    services: [],
    languageCodes: ["de", "en"],
    credentials: [],
  },
];
