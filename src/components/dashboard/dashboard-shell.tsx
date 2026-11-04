"use client";

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
  const pathname = usePathname() ?? "";
  const items = variant === "customer" ? customerNavItems : professionalNavItems;

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <DashboardSidebar eyebrow={eyebrow} pathname={pathname} items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader title={title} accountLabel={accountLabel} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
