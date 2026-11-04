import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";

/**
 * Directory page heading, breadcrumbs and the honesty notice about the data
 * behind the results.
 *
 * The notice is not decoration: these results come from typed local fixtures,
 * not from a Convex query, and AGENTS.md/DESIGN.md section 11 both require
 * that a preview never reads as live inventory.
 */
export function DirectoryHeader({ resultCount, preview = true }: { resultCount: number; preview?: boolean }) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-tint/50">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-14 right-[4%] select-none text-[11rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[15rem]"
      >
        {resultCount}
      </span>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:max-w-[72ch] lg:px-8">
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

        <Reveal className="flex flex-col gap-3">
          <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            Find the right <span className="text-action">tax accountant</span> for your needs
          </h1>
          <p className="max-w-[70ch] text-lead text-slate">
            Explore tax and accounting professionals by country, tax jurisdiction, specialty and
            language.
          </p>
        </Reveal>

        {preview ? <Reveal delayMs={100}>
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
        </Reveal> : <p className="text-compact text-slate">Approved USA listings. Search covers up to 100 recently published profiles. Publication does not verify every self-reported credential.</p>}
      </div>
    </div>
  );
}
