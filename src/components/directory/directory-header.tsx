import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";

/**
 * Directory page heading, breadcrumbs and the honesty notice about the data
 * behind the results.
 *
 * The notice is not decoration: these results come from typed local fixtures,
 * not from a Convex query, and AGENTS.md/DESIGN.md section 11 both require
 * that a preview never reads as live inventory.
 */
export function DirectoryHeader({ resultCount }: { resultCount: number }) {
  return (
    <div className="border-b border-border bg-tint/50">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-caption text-slate">
            <li>
              <Link
                href="/"
                className="transition-colors duration-150 hover:text-action hover:underline"
              >
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3 w-3" />
            </li>
            <li aria-current="page" className="font-medium text-navy">
              Find an Accountant
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-3">
          <h1 className="max-w-[26ch] text-hero font-semibold text-navy">
            Find the Right Tax Accountant for Your Needs
          </h1>
          <p className="max-w-[70ch] text-lead text-slate">
            Explore tax and accounting professionals by country, tax jurisdiction, specialty and
            language.
          </p>
        </div>

        <p className="flex max-w-[80ch] gap-2 rounded-card border border-border bg-white px-4 py-3 text-caption text-slate">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
          <span>
            <strong className="font-semibold text-navy">
              Development preview — {resultCount} example profiles.
            </strong>{" "}
            These are development-only examples used to build and test the directory, not live
            listings. Designations shown are self-declared and have not been verified. No ratings,
            reviews, prices or availability are shown, because none of that data exists yet.
            The profile pages these cards open are excluded from search indexing for the same
            reason.
          </span>
        </p>
      </div>
    </div>
  );
}
