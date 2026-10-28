import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { blockersOnly, warningsOnly, type PublishIssue } from "@/lib/cms/content-validation";

interface ContentValidationSummaryProps {
  issues: PublishIssue[];
  /** What is being checked, for the heading — "article", "page". */
  subject: string;
}

/**
 * Publish-readiness summary.
 *
 * Separate from the field-level error summary the editors already render.
 * That one answers "is this form well-formed"; this answers "is this fit to
 * be seen by the public", which is a later and different question — a
 * perfectly well-formed article with no recorded review is still unfit.
 *
 * Blockers and warnings are visually and semantically distinct, and the
 * distinction is load-bearing: a missing meta description degrades a search
 * result, while unreviewed tax content misleads a reader. Collapsing them
 * into one list would flatten that difference.
 *
 * The two headings are `h2`, not `h3`: this block sits directly under the
 * screen's single `h1` with nothing between, so an `h3` would skip a level
 * for anyone navigating by headings.
 *
 * `role="status"` rather than `role="alert"`: this reflects the state of the
 * record as the editor works, so it should not interrupt on every keystroke.
 */
export function ContentValidationSummary({ issues, subject }: ContentValidationSummaryProps) {
  const blockers = blockersOnly(issues);
  const warnings = warningsOnly(issues);

  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <div
        role="status"
        className="flex gap-2 rounded-card border border-success/40 bg-white px-4 py-3"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        <p className="text-caption text-slate">
          <strong className="font-semibold text-navy">
            Ready to publish, as far as these checks go.
          </strong>{" "}
          Nothing blocks publication of this {subject}. The authorized publish mutation must
          re-run the same checks server-side before it writes anything.
        </p>
      </div>
    );
  }

  return (
    <div role="status" className="flex flex-col gap-3 rounded-card border border-border bg-white p-4">
      {blockers.length ? (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-compact font-semibold text-danger">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {blockers.length === 1
              ? `1 issue blocks publishing this ${subject}`
              : `${blockers.length} issues block publishing this ${subject}`}
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {blockers.map((issue, index) => (
              <li key={index} className="text-caption text-slate">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-compact font-semibold text-warning">
            <Info className="h-4 w-4" aria-hidden />
            {warnings.length === 1 ? "1 thing worth fixing" : `${warnings.length} things worth fixing`}
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {warnings.map((issue, index) => (
              <li key={index} className="text-caption text-slate">
                {issue.message}
              </li>
            ))}
          </ul>
          <p className="text-caption text-slate">
            These do not prevent publication.
          </p>
        </div>
      ) : null}
    </div>
  );
}
