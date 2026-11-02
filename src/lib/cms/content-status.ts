/**
 * The editorial status model and its transitions.
 *
 * ## Source of truth
 * The four states mirror `contentPages.status` in `convex/schema.ts`
 * exactly — `draft | review | published | archived`. Nothing here invents a
 * fifth state, and "unpublished" is deliberately **not** one: unpublishing
 * returns content to `draft`, which is what the schema can represent. A
 * status the database cannot store is a status the UI must not offer.
 *
 * ## What this module is and is not
 * It describes which transitions are *legal* and what each one requires.
 * It does **not** decide who may perform one — that is an authorization
 * question, it is answered server-side, and no authorization exists in this
 * project yet. `transitionAvailability()` therefore reports every transition
 * as unavailable with a reason, and the UI renders them disabled.
 *
 * When the authorized mutations land (`content:saveDraft`,
 * `content:requestReview`, `content:publish`, `content:unpublish` — API.md
 * section 3), this module keeps describing the legal shape of the workflow
 * and the server keeps deciding permission. The two must agree, and the
 * server is authoritative: a client-side check is a convenience for the
 * editor, never a control.
 */

export type EditorialStatus = "draft" | "review" | "published" | "archived";

export const EDITORIAL_STATUSES: EditorialStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

/** The actions an editor can take, named as the mutations will be. */
export type EditorialAction =
  | "saveDraft"
  | "submitForReview"
  | "returnToDraft"
  | "publish"
  | "unpublish"
  | "archive";

export interface TransitionDefinition {
  action: EditorialAction;
  label: string;
  /** Status the content ends in. `saveDraft` keeps the current status. */
  to: EditorialStatus | "unchanged";
  /** Statuses this action may be taken from. */
  from: EditorialStatus[];
  description: string;
  /** Publish and archive change what the public sees; confirm them. */
  destructive?: boolean;
  /** The authorized Convex mutation this maps to, once it exists. */
  mutation: string;
}

/**
 * The legal transitions.
 *
 * Draft → Review → Published → (back to Draft | Archived), which is the
 * workflow the Day 7 brief specifies. Deliberately absent: any notion of
 * self-approval shortcuts, scheduled publishing, or multi-stage sign-off —
 * none of those are specified, and inventing workflow rules is as much a
 * fabrication as inventing data.
 */
export const TRANSITIONS: TransitionDefinition[] = [
  {
    action: "saveDraft",
    label: "Save draft",
    to: "unchanged",
    from: ["draft", "review", "published", "archived"],
    description: "Store the current edits without changing publication state.",
    mutation: "content:saveDraft",
  },
  {
    action: "submitForReview",
    label: "Submit for review",
    to: "review",
    from: ["draft"],
    description: "Hand the content to a reviewer. It stays off the public site.",
    mutation: "content:requestReview",
  },
  {
    action: "returnToDraft",
    label: "Return to draft",
    to: "draft",
    from: ["review"],
    description: "Send the content back to its author for changes.",
    mutation: "content:saveDraft",
  },
  {
    action: "publish",
    label: "Publish",
    to: "published",
    from: ["review"],
    description: "Make the content publicly visible and eligible for indexing.",
    destructive: true,
    mutation: "content:publish",
  },
  {
    action: "unpublish",
    label: "Unpublish",
    to: "draft",
    from: ["published"],
    description: "Remove the content from the public site and return it to draft.",
    destructive: true,
    mutation: "content:unpublish",
  },
  {
    action: "archive",
    label: "Archive",
    to: "archived",
    from: ["draft", "published"],
    description: "Retire the content, keeping the record and its review history.",
    destructive: true,
    mutation: "content:unpublish",
  },
];

/** Transitions that are structurally legal from a given status. */
export function transitionsFrom(status: EditorialStatus): TransitionDefinition[] {
  return TRANSITIONS.filter((transition) => transition.from.includes(status));
}

export function canTransition(from: EditorialStatus, action: EditorialAction): boolean {
  const transition = TRANSITIONS.find((entry) => entry.action === action);
  return Boolean(transition && transition.from.includes(from));
}

/** Resulting status, or the current one for actions that do not move it. */
export function resultingStatus(
  from: EditorialStatus,
  action: EditorialAction,
): EditorialStatus {
  const transition = TRANSITIONS.find((entry) => entry.action === action);
  if (!transition || !transition.from.includes(from)) return from;
  return transition.to === "unchanged" ? from : transition.to;
}

export interface TransitionAvailability {
  action: EditorialAction;
  label: string;
  description: string;
  destructive: boolean;
  /** Whether the action can be performed right now. */
  enabled: boolean;
  /** Why not, when `enabled` is false. Always shown next to the control. */
  blockedReason?: string;
  mutation: string;
}

/**
 * The single reason every editorial control is currently disabled.
 *
 * Kept as one constant so no screen can drift into a softer wording, and so
 * there is exactly one place to change when the backend lands.
 */
export const NO_BACKEND_REASON =
  "No authorized Convex mutation exists yet for staff sign-in to authorize. This control is inert rather than pretending to save.";

export interface AvailabilityContext {
  status: EditorialStatus;
  /**
   * Whether an authorized, permission-checked backend is wired up. Always
   * `false` today — see `NO_BACKEND_REASON`. Kept as a parameter rather than
   * hard-coded so the call sites already read correctly once it flips.
   */
  backendReady?: boolean;
  /** Blocking problems from `content-validation`, e.g. an unreviewed article. */
  blockers?: Partial<Record<EditorialAction, string>>;
}

/**
 * What the action bar should render.
 *
 * Validation blockers take precedence over the missing-backend reason,
 * because they are the more useful thing to tell an editor: "this article
 * has no recorded review" is actionable, "there is no backend" is not.
 */
export function transitionAvailability({
  status,
  backendReady = false,
  blockers = {},
}: AvailabilityContext): TransitionAvailability[] {
  return transitionsFrom(status).map((transition) => {
    const blocker = blockers[transition.action];

    return {
      action: transition.action,
      label: transition.label,
      description: transition.description,
      destructive: Boolean(transition.destructive),
      enabled: backendReady && !blocker,
      blockedReason: blocker ?? (backendReady ? undefined : NO_BACKEND_REASON),
      mutation: transition.mutation,
    };
  });
}

const STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
  archived: "Archived",
};

/** What each state means for a reader of the public site. */
const STATUS_VISIBILITY: Record<EditorialStatus, string> = {
  draft: "Not publicly visible.",
  review: "Not publicly visible.",
  published: "Publicly visible and eligible for indexing.",
  archived: "Not publicly visible.",
};

export const statusLabel = (status: EditorialStatus) => STATUS_LABELS[status];
export const statusVisibility = (status: EditorialStatus) => STATUS_VISIBILITY[status];

/**
 * The one predicate deciding whether content may appear publicly.
 *
 * Every public mapper routes through this rather than comparing strings
 * inline, so "published means published" is asserted in exactly one place.
 * It is a frontend convenience, not a boundary: the authorized query must
 * filter server-side as well, because a frontend check protects nothing from
 * a caller who does not run it.
 */
export function isPubliclyVisible(status: EditorialStatus): boolean {
  return status === "published";
}
