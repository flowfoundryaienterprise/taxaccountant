import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileActionBarProps {
  backHref: string;
  /** Whether a contact route exists; the label stays honest either way. */
  contactAvailable: boolean;
}

/**
 * Mobile-only action strip, pinned to the bottom of the viewport below the
 * `sm` breakpoint.
 *
 * The page reserves matching bottom padding, so the bar overlays empty space
 * rather than covering the last section — the Day 5 brief's "mobile contact
 * CTA remains accessible without hiding important content". Both controls are
 * full-height links, comfortably above the 44px touch target minimum
 * (DESIGN.md section 10).
 *
 * When no contact channel is enabled, the primary control still scrolls to
 * the contact section — which is where the honest explanation lives — rather
 * than pretending to open a message.
 */
export function ProfileActionBar({ backHref, contactAvailable }: ProfileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-12px_32px_-24px_rgba(16,44,87,0.6)] backdrop-blur sm:hidden">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          aria-label="Back to search results"
          className={cn(buttonVariants({ variant: "outline", size: "md" }), "shrink-0 px-3")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Back</span>
        </Link>

        <a
          href="#contact"
          className={cn(buttonVariants({ size: "md" }), "flex-1 whitespace-normal text-center")}
        >
          <MessageSquareText className="h-4 w-4 shrink-0" aria-hidden />
          {contactAvailable ? "Contact professional" : "Contact options"}
        </a>
      </div>
    </div>
  );
}
