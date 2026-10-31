import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarketplaceCtaProps {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Small line under the buttons — used for the honest-availability note. */
  note?: string;
}

/**
 * Closing call to action shared by the service and country pages.
 *
 * Deep links are passed in already built (`directoryHref`), so the selected
 * service or country survives the jump into `/find-accountant` and shows up
 * in the directory's active-filter chips.
 */
export function MarketplaceCta({
  title,
  description,
  primary,
  secondary,
  note,
}: MarketplaceCtaProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col items-start gap-6 rounded-panel bg-navy px-6 py-12 text-white sm:px-12">
          <div className="flex max-w-[58ch] flex-col gap-3">
            <h2 className="text-heading-lg font-semibold">{title}</h2>
            <p className="text-lead text-white/80">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Labels carry country and service names, so the default
                `whitespace-nowrap` is relaxed — a long name wraps rather
                than pushing the page sideways on a 375px screen. */}
            <Link
              href={primary.href}
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-auto max-w-full whitespace-normal py-3 text-left transition-transform duration-150",
              )}
            >
              {primary.label}
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>

            {secondary ? (
              <Link
                href={secondary.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "border border-white/30 text-white hover:bg-white/10",
                )}
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>

          {note ? <p className="max-w-[70ch] text-caption text-white/70">{note}</p> : null}
        </div>
      </Container>
    </section>
  );
}
