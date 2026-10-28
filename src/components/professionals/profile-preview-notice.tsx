import { FlaskConical } from "lucide-react";

/**
 * The honesty notice carried by every profile page.
 *
 * Not decoration: this page is rendered from typed local fixtures, not from
 * a Convex query, and both AGENTS.md and DESIGN.md section 11 require that a
 * development preview never read as a published listing of a real person.
 * Worded to match the directory's notice so the two cannot drift.
 */
export function ProfilePreviewNotice({ name }: { name: string }) {
  return (
    <p className="flex max-w-[86ch] gap-2 rounded-card border border-border bg-white px-4 py-3 text-caption text-slate">
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
      <span>
        <strong className="font-semibold text-navy">Development preview — example profile.</strong>{" "}
        {name} is a development-only example used to build and test profile pages, not a real
        person or a live listing, and this page is excluded from search indexing. Designations are
        self-declared and have not been verified. No ratings, reviews, fees, years of experience or
        availability are shown, because none of that data exists.
      </span>
    </p>
  );
}
