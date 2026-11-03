"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SkipLink } from "@/components/layout/skip-link";

/**
 * The CMS frame: sidebar rail, sticky header, scrollable content column.
 *
 * Client-side only because of the mobile drawer and the active-route
 * highlight. Every screen inside it stays a Server Component — the shell
 * takes `children` and never reaches into them.
 *
 * Responsive behaviour:
 *  - `<lg` the sidebar is an off-canvas drawer, opened from the header,
 *    closed by Escape, by the backdrop, or by following any link.
 *  - `>=lg` it is a sticky full-height rail and the toggle disappears.
 */
interface AdminShellProps {
  children: React.ReactNode;
  /** The signed-in staff member's role, resolved server-side in `admin/layout.tsx`. */
  staffRole: "cms_admin" | "cms_editor";
}

export function AdminShell({ children, staffRole }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const close = React.useCallback(() => setSidebarOpen(false), []);

  // Escape closes the drawer. Bound only while it is open, so the public
  // key handling of nested screens is untouched the rest of the time.
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, close]);

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <SkipLink />
      <AdminSidebar pathname={pathname} open={sidebarOpen} onClose={close} staffRole={staffRole} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader pathname={pathname} staffRole={staffRole} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
