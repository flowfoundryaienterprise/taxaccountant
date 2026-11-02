"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { activeNavHref, adminNavigation } from "@/lib/admin/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  pathname: string;
  /** Mobile drawer state. On `lg` and above the sidebar is always present. */
  open: boolean;
  onClose: () => void;
}

/**
 * CMS primary navigation.
 *
 * One list, rendered once, used both as the fixed desktop rail and as the
 * mobile drawer — so the two can never drift. Below `lg` it is a dialog:
 * it traps nothing but is labelled, closes on Escape and on backdrop click
 * (both wired by `AdminShell`), and every link closes it on navigation.
 */
export function AdminSidebar({ pathname, open, onClose }: AdminSidebarProps) {
  const active = activeNavHref(pathname);

  return (
    <>
      {/* Mobile backdrop. `lg:hidden` so it can never cover the desktop rail. */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-navy/40 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="CMS sections"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-white transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-border px-5">
          {/*
            The mark with its wordmark, matching the public header. The
            previous brand block was the mark alone: the old square tile
            filled its box and held the 64px rail head on its own, but the
            shield is inset within the same box and read as a small shape
            floating in white. Naming the product also tells a staff member
            which site's CMS they have open, which the rail never said.
          */}
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-2"
            aria-label="CMS overview"
          >
            <BrandLogo size={28} className="shrink-0" />
            <span className="min-w-0 truncate text-compact font-medium text-navy">
              TaxAccountant <span className="text-slate">CMS</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-slate hover:bg-subtle lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav aria-label="CMS navigation" className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {adminNavigation.map((item) => {
              const isActive = item.href === active;

              return (
                <li key={item.href} className="relative">
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-action"
                    />
                  ) : null}
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-[0.625rem] px-3 py-2 text-compact font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
                      isActive
                        ? "bg-tint text-action"
                        : "text-slate hover:translate-x-0.5 hover:bg-subtle hover:text-navy",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 break-words">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-border p-4">
          <p className="text-caption text-slate">
            Phase 1 content management. Booking, payments, subscriptions and reporting are later
            phases and are not part of this interface.
          </p>
        </div>
      </aside>
    </>
  );
}
