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

/** Tabbable descendants, in DOM order. */
function focusableWithin(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  ];
}

export function MobileNavigation({ primaryLinks, sections }: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  // Read for active-page indication only. The sheet closes from each
  // link's own `onClick`, not from an effect watching the pathname.
  const pathname = usePathname() ?? "/";

  React.useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      /*
       * The panel declares `aria-modal="true"`, which tells assistive
       * technology that the rest of the page is unavailable. Keeping Tab
       * inside the sheet is what makes that declaration true for keyboard
       * users as well; without it, Tab walked straight out of an open
       * "modal" and into the page behind it.
       */
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = focusableWithin(panel);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /*
   * Return focus to the control that opened the sheet. Without this, closing
   * with Escape dropped focus onto <body> and the next Tab restarted at the
   * top of the document.
   *
   * Skipped on first render so the button is not focused on page load, and
   * skipped when the sheet closed because a link inside it was followed —
   * that navigation owns focus placement.
   */
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (wasOpen.current && !open && toggleRef.current?.isConnected) {
      if (panelRef.current?.contains(document.activeElement)) {
        toggleRef.current.focus();
      }
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-input text-navy transition-colors duration-150 hover:bg-tint"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {/*
        `inert` is what actually closes the sheet for keyboard and screen
        reader users. It is kept mounted so the slide transition can run, and
        `translate-x-full` only moves it off-screen — measured at 375px, the
        closed sheet still held all 27 of its links in the tab order and in
        the accessibility tree, under a permanent `aria-modal="true"`.
        `inert` removes both, and is the one attribute that does, because a
        bare `aria-hidden` on a subtree that is still focusable is itself an
        ARIA violation.
      */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
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
              <p className="px-3 text-caption text-slate">
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
