"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { isActivePath } from "@/components/layout/nav-link";
import type { NavDropdownItem } from "@/components/layout/nav-dropdown";
import { cn } from "@/lib/utils";

interface NavSection {
  label: string;
  items: NavDropdownItem[];
}

interface MobileNavigationProps {
  primaryLinks: { label: string; href: string }[];
  sections: NavSection[];
}

export function MobileNavigation({ primaryLinks, sections }: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Read for active-page indication only. The sheet closes from each
  // link's own `onClick`, not from an effect watching the pathname.
  const pathname = usePathname() ?? "/";

  React.useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-input text-navy transition-colors duration-150 hover:bg-tint"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <nav className="flex flex-col gap-6 px-4 py-6">
          <ul className="flex flex-col gap-1">
            {primaryLinks.map((link) => {
              const active = isActivePath(pathname, link.href, link.href !== "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-input px-3 py-3 text-compact font-medium hover:bg-tint",
                      active ? "bg-tint text-action" : "text-navy",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-3 text-caption font-semibold uppercase tracking-wide text-slate">
                {section.label}
              </p>
              {section.items.map((item) =>
                item.available ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={
                      isActivePath(pathname, item.href, false) ? "page" : undefined
                    }
                    className={cn(
                      "block rounded-input px-3 py-2.5 text-compact hover:bg-tint",
                      isActivePath(pathname, item.href, false)
                        ? "bg-tint font-medium text-action"
                        : "text-navy",
                      item.featured && "font-semibold text-action",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    className="flex items-center justify-between gap-2 rounded-input px-3 py-2.5 text-compact text-slate opacity-60"
                  >
                    {item.label}
                    <Lock className="h-3 w-3 shrink-0" aria-hidden />
                  </span>
                ),
              )}
            </div>
          ))}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline", size: "md" }))}
            >
              Sign In
            </Link>
            <Link
              href="/sign-in?intent=signup"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "primary", size: "md" }))}
            >
              Create an Account
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
