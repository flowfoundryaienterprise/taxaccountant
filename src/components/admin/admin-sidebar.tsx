"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import {
  ADMIN_NAV_GROUP_ORDER,
  activeNavHref,
  adminNavigation,
  type AdminNavGroup,
} from "@/lib/admin/admin-navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  pathname: string;
  /** Mobile drawer state. On `lg` and above the sidebar is always present. */
  open: boolean;
  onClose: () => void;
  /** Hides `adminOnly` nav entries from a `cms_editor`. */
  staffRole: "cms_admin" | "cms_editor";
}

/**
 * CMS primary navigation.
 *
 * One list, rendered once, used both as the fixed desktop rail and as the
 * mobile drawer — so the two can never drift. Below `lg` it is a dialog:
 * it traps nothing but is labelled, closes on Escape and on backdrop click
 * (both wired by `AdminShell`), and every link closes it on navigation.
 */
export function AdminSidebar({ pathname, open, onClose, staffRole }: AdminSidebarProps) {
  const active = activeNavHref(pathname);
  const visibleNavigation = adminNavigation.filter(
    (item) => !item.adminOnly || staffRole === "cms_admin",
  );
  const groups: { group: AdminNavGroup; items: typeof visibleNavigation }[] = ADMIN_NAV_GROUP_ORDER.map(
    (group) => ({
      group,
      items: visibleNavigation.filter((item) => item.group === group),
    }),
  ).filter((entry) => entry.items.length > 0);

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
          "fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-navy/60 bg-navy transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[80px] shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
          {/*
            The mark with its wordmark, matching the public header. Naming
            the product also tells a staff member which site's CMS they have
            open, which the rail never said on its own, and the "ADMIN
            CONSOLE" caption underneath matches the approved mockup.
          */}
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-2"
            aria-label="CMS overview"
          >
            <BrandLogo size={28} className="shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span className="min-w-0 truncate text-compact font-semibold text-white">
                TaxAccountant
              </span>
              <span className="text-[0.65rem] font-medium tracking-wide text-white/75 uppercase">
                Admin console
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav aria-label="CMS navigation" className="flex-1 overflow-y-auto p-3">
          {groups.map(({ group, items }) => (
            <div key={group} className="mb-5">
              <p className="px-3 pb-1 text-[0.65rem] font-semibold tracking-wide text-white/75 uppercase">
                {group}
              </p>
              <ul className="flex flex-col gap-1">
                {items.map((item) => {
                  const isActive = item.href === active;

                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-[0.625rem] px-3 py-2 text-compact font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
                          isActive
                            ? "bg-action text-white"
                            : "text-white/70 hover:translate-x-0.5 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 text-caption font-medium text-white/70 transition-colors duration-150 hover:text-white"
          >
            View website
          </Link>
        </div>
      </aside>
    </>
  );
}
