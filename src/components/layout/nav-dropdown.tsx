"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavDropdownItem {
  label: string;
  href: string;
  available: boolean;
  /** Renders above a divider — used for the "All …" overview link. */
  featured?: boolean;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
  /**
   * Route prefix that makes this menu the active section, e.g. `/services`.
   * Omit for menus that do not own a route of their own.
   */
  activePrefix?: string;
}

/**
 * Click-to-open (not hover-only) so it works with keyboard and touch.
 * Unavailable future-phase destinations render as disabled text instead of
 * a link — DESIGN.md: "Future-phase features must display honest
 * availability information instead of pretending to work."
 */
export function NavDropdown({ label, items, activePrefix }: NavDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "/";

  const active = Boolean(
    activePrefix && (pathname === activePrefix || pathname.startsWith(`${activePrefix}/`)),
  );

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
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group relative flex items-center gap-1 whitespace-nowrap text-compact font-medium transition-colors duration-150 hover:text-action",
          active ? "text-action" : "text-navy",
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-0.5 bg-action transition-[width] duration-200",
            active ? "w-full" : "w-0 group-hover:w-full",
          )}
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
                className={cn(
                  "animate-fade-up block rounded-input px-3 py-2 text-compact text-navy transition-all duration-150 hover:translate-x-0.5 hover:bg-tint",
                  item.featured && "mb-1 border-b border-border pb-2.5 font-semibold text-action",
                )}
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
