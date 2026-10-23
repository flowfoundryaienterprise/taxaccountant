"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavDropdownItem {
  label: string;
  href: string;
  available: boolean;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
}

/**
 * Click-to-open (not hover-only) so it works with keyboard and touch.
 * Unavailable future-phase destinations render as disabled text instead of
 * a link — DESIGN.md: "Future-phase features must display honest
 * availability information instead of pretending to work."
 */
export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 text-compact font-medium text-navy transition-colors duration-150 hover:text-action"
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-menu-pop absolute left-0 top-full z-10 mt-2 w-64 origin-top rounded-card border border-border bg-white p-2 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.3)]"
        >
          {items.map((item, index) =>
            item.available ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="animate-fade-up block rounded-input px-3 py-2 text-compact text-navy transition-all duration-150 hover:translate-x-0.5 hover:bg-tint"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                role="menuitem"
                aria-disabled="true"
                className="animate-fade-up flex items-center justify-between gap-2 rounded-input px-3 py-2 text-compact text-slate opacity-60"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {item.label}
                <Lock className="h-3 w-3 shrink-0" aria-hidden />
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
