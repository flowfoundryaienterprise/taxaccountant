import type {
  ContentStatus,
  ListingStatus,
  ServicePublicationStatus,
  StatusTone,
  VerificationStatus,
} from "@/lib/admin/admin-types";

/**
 * Display helpers for the CMS.
 *
 * Pure functions, no framework imports — one place where a status label, a
 * date or a file size is decided, so two tables can never disagree.
 */

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
  archived: "Archived",
  suspended: "Suspended",
  not_reviewed: "Not reviewed",
  pending: "Review pending",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
  // publicMessages statuses (src/app/admin/messages).
  new: "New",
  reviewing: "Reviewing",
  closed: "Closed",
  spam: "Spam",
};

const STATUS_TONES: Record<string, StatusTone> = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "neutral",
  suspended: "danger",
  not_reviewed: "neutral",
  pending: "warning",
  verified: "success",
  rejected: "danger",
  expired: "warning",
  new: "info",
  reviewing: "warning",
  closed: "neutral",
  spam: "danger",
};

export function statusLabel(
  status: ContentStatus | ServicePublicationStatus | ListingStatus | VerificationStatus | string,
): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: string): StatusTone {
  return STATUS_TONES[status] ?? "neutral";
}

/**
 * Fixed-format UTC date.
 *
 * Deliberately not locale-relative ("3 days ago"): a CMS row's timestamp is
 * an editorial fact that staff compare against each other, and a relative
 * string hides the actual value. `undefined` renders as an em dash by the
 * caller rather than as today's date.
 */
export function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Binary units, one decimal place above 1 KiB. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

/**
 * Slugifies a title the same way the public routes expect: lowercase,
 * ASCII-folded, hyphen-separated. Used for the "suggest from title" control
 * in the page and article forms.
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Truncates for table cells without cutting mid-word where avoidable. */
export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  const cut = input.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** "3 services" / "1 service" — avoids a dozen inline ternaries in tables. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Google-style truncation points, used by the SEO search-appearance preview. */
export const SEO_TITLE_PIXEL_GUIDE = 60;
export const SEO_DESCRIPTION_PIXEL_GUIDE = 155;
