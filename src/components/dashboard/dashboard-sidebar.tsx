"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * False for a destination with no route behind it yet. Renders locked
   * rather than linking to a page that doesn't exist — the same rule
   * `NavDropdown` already applies to future-phase public nav items
   * (DESIGN.md: "Future-phase features must display honest availability
   * information instead of pretending to work").
   */
  available?: boolean;
}

interface DashboardSidebarProps {
  /** e.g. "Customer account" or "Professional console". */
  eyebrow: string;
  pathname: string;
  items: DashboardNavItem[];
}

/**
 * The customer/professional dashboard rail — same dark-navy treatment as
 * `AdminSidebar` (the approved CMS dashboard mockup), so every signed-in
 * area of the site reads as one design system rather than three unrelated
 * ones. Unlike the CMS rail it has no role-based grouping or mobile drawer
 * yet: the customer and professional dashboards are a single overview
 * screen each today, not a multi-screen section.
 */
export function DashboardSidebar({ eyebrow, pathname, items }: DashboardSidebarProps) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-navy/60 bg-navy lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-[72px] shrink-0 items-center gap-2 border-b border-white/10 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="TaxAccountant home">
          <BrandLogo size={28} className="shrink-0" />
          <span className="flex min-w-0 flex-col">
            <span className="min-w-0 truncate text-compact font-semibold text-white">
              TaxAccountant
            </span>
            <span className="text-[0.65rem] font-medium tracking-wide text-white/50 uppercase">
              {eyebrow}
            </span>
          </span>
        </Link>
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = item.href === pathname;

            if (item.available === false) {
              return (
                <li key={item.label}>
                  <span className="flex min-h-11 items-center justify-between gap-3 rounded-[0.625rem] px-3 py-2 text-compact font-medium text-white/40">
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </span>
                    <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </span>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-[0.625rem] px-3 py-2 text-compact font-medium transition-colors duration-150",
                    isActive
                      ? "bg-action text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <Link
          href="/"
          className="text-caption font-medium text-white/70 transition-colors duration-150 hover:text-white"
        >
          View website
        </Link>
      </div>
    </aside>
  );
}
