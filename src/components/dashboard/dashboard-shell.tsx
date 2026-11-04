"use client";

import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { customerNavItems, professionalNavItems } from "@/lib/dashboard/dashboard-navigation";

interface DashboardShellProps {
  eyebrow: string;
  title: string;
  accountLabel: string;
  /**
   * Which fixed nav list to render — never the items themselves. The list
   * lives in `@/lib/dashboard/dashboard-navigation`, a plain module import
   * `DashboardSidebar` resolves client-side; see that file's comment for
   * why a server page must never pass icon components down as props.
   */
  variant: "customer" | "professional";
  children: React.ReactNode;
}

/** The customer/professional dashboard frame — see `DashboardSidebar` for why it mirrors `AdminShell`. */
export function DashboardShell({ eyebrow, title, accountLabel, variant, children }: DashboardShellProps) {
  const drawer = useRef<HTMLDialogElement>(null);
  const pathname = usePathname() ?? "";
  const items = variant === "customer" ? customerNavItems : professionalNavItems;

  return (
    <div className="reference-dashboard flex min-h-screen w-full bg-tint">
      <div className="hidden lg:block"><DashboardSidebar eyebrow={eyebrow} pathname={pathname} items={items} /></div>
      <dialog ref={drawer} aria-label="Account navigation" className="reference-drawer" onClick={event => { if (event.target === event.currentTarget || (event.target as HTMLElement).closest("a")) drawer.current?.close(); }}>
        <button type="button" aria-label="Close navigation" onClick={() => drawer.current?.close()} className="absolute top-3 right-2 z-10 rounded p-2 text-white"><X size={20} /></button>
        <DashboardSidebar eyebrow={eyebrow} pathname={pathname} items={items} />
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <button type="button" onClick={() => drawer.current?.showModal()} className="flex items-center gap-2 border-b border-border bg-white px-4 py-3 text-compact font-semibold lg:hidden"><Menu size={20} aria-hidden />Menu</button>
        <DashboardHeader title={title} accountLabel={accountLabel} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
