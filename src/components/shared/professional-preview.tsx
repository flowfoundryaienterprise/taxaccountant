import Link from "next/link";
import { ArrowRight, FlaskConical, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ProfessionalCard } from "@/components/shared/professional-card";
import { buttonVariants } from "@/components/ui/button";
import { toCardModel } from "@/lib/directory/card-model";
import type { DirectoryProfessional } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

interface ProfessionalPreviewProps {
  professionals: DirectoryProfessional[];
  /** Fully-built directory URL carrying the service/country filter. */
  directoryHref: string;
  directoryLabel: string;
  /** What the reader was looking for, used in the empty state copy. */
  subject: string;
  /** How many cards to show before deferring to the directory. */
  limit?: number;
  /** Total matches, when more exist than are shown. */
  total?: number;
}

/**
 * A short, honest preview of professionals matching a service or country,
 * with a link into the full directory.
 *
 * Renders the same `ProfessionalCard` the directory renders, through the
 * same `toCardModel` projection, so nothing can appear here that the
 * directory would not show — including the absence of ratings, prices and
 * availability. `cta="pending"` because `/professionals/[slug]` does not
 * exist yet (IMPLEMENTATION_PLAN.md day 10).
 *
 * The preview notice is required, not decorative: these rows are Day 3
 * development fixtures, not published listings.
 */
export function ProfessionalPreview({
  professionals,
  directoryHref,
  directoryLabel,
  subject,
  limit = 3,
  total,
}: ProfessionalPreviewProps) {
  if (professionals.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title={`No professionals are listed for ${subject} yet`}
        description="Nothing is shown here rather than showing something that does not exist. You can widen the search in the directory, or check back once more professionals are published."
        actions={[
          { label: "Open the full directory", href: "/find-accountant" },
          { label: "Browse all services", href: "/services", variant: "outline" },
        ]}
      />
    );
  }

  const shown = professionals.slice(0, limit);
  const matched = total ?? professionals.length;

  return (
    <div className="flex flex-col gap-5">
      <p className="flex gap-2 rounded-card border border-border bg-white px-4 py-3 text-caption text-slate">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
        <span>
          <strong className="font-semibold text-navy">
            Development preview — {matched} example {matched === 1 ? "profile" : "profiles"}.
          </strong>{" "}
          These are development-only examples used to build and test discovery, not live listings.
          Designations are self-declared and unverified, and profile pages are not published yet.
        </span>
      </p>

      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((professional) => (
          <li key={professional.slug} className="flex">
            <ProfessionalCard
              professional={toCardModel(professional)}
              cta="pending"
              saveable={false}
              className="h-full w-full"
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            />
          </li>
        ))}
      </ol>

      {/* `buttonVariants` sets `whitespace-nowrap`, which a label this long
          pushes past a 375px viewport. Overridden here to wrap and grow
          instead of overflowing. */}
      <Link
        href={directoryHref}
        className={cn(
          buttonVariants({ variant: "outline", size: "md" }),
          "group h-auto max-w-full whitespace-normal px-4 py-3 text-left sm:w-fit",
        )}
      >
        {directoryLabel}
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
