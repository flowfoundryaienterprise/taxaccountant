/**
 * One source of truth for the consent version stamped on every public form
 * submission (`publicMessages.consentVersion`). Bump this string whenever
 * the privacy notice a submitter is shown actually changes, so a stored
 * message can always be traced to the exact text its sender agreed to —
 * the point of recording a version at all, not just a boolean.
 */
export const CONSENT_VERSION = "2026-11-02-phase1-placeholder";
