"use client";

import * as React from "react";
import { DollarSign, Globe } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Localization (PRD.md Phase 5) and multi-currency display aren't built
 * yet, so these controls show the only currently-supported option plus a
 * disabled, clearly-labeled list of what's planned — never a switcher that
 * silently does nothing. DESIGN.md: show honest availability, not a fake
 * working control.
 */
function LocaleMenu({
  icon: Icon,
  current,
  planned,
  srLabel,
}: {
  icon: typeof Globe;
  current: string;
  planned: string[];
  srLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={srLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 whitespace-nowrap rounded-input px-1.5 py-1.5 text-caption font-medium text-slate transition-colors duration-150 hover:bg-tint hover:text-navy"
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {current}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-52 rounded-card border border-border bg-white p-2 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.3)]"
        >
          <p className={cn("px-3 py-1 text-caption font-semibold text-navy")}>{current} (active)</p>
          <p className="px-3 pb-1 text-caption text-slate">More options arrive with Phase 5 localization:</p>
          {planned.map((option) => (
            <span key={option} className="block px-3 py-1 text-caption text-slate opacity-60">
              {option}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LocaleSelectors() {
  return (
    <div className="flex items-center gap-1">
      <LocaleMenu icon={Globe} current="EN" planned={["Spanish", "Portuguese", "Hindi"]} srLabel="Language selector: English (US)" />
      <LocaleMenu icon={DollarSign} current="USD" planned={["EUR", "GBP", "INR"]} srLabel="Currency selector" />
    </div>
  );
}
