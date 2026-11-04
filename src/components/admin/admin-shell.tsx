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
  const contentRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setSidebarOpen(false), []);

  // Escape closes the drawer. Bound only while it is open, so the public
  // key handling of nested screens is untouched the rest of the time.
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = document.querySelector<HTMLElement>("[data-admin-sidebar]");
    const focusable = () => Array.from(sidebar?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]') ?? []).filter(el=>el.getClientRects().length>0);
    focusable()[0]?.focus();
    const content = contentRef.current;
    if (content) content.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const elements=focusable(),first=elements[0],last=elements.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const desktop=window.matchMedia("(min-width: 1024px)");
    const onResize=()=>{if(desktop.matches)close();};
    desktop.addEventListener("change",onResize);
    return () => {window.removeEventListener("keydown", onKeyDown);desktop.removeEventListener("change",onResize);if(content)content.inert=false;document.body.style.overflow=overflow;previous?.focus();};
  }, [sidebarOpen, close]);

  return (
    <div className="reference-dashboard flex min-h-screen w-full bg-tint">
      <SkipLink />
      <AdminSidebar pathname={pathname} open={sidebarOpen} onClose={close} staffRole={staffRole} />

      <div ref={contentRef} className="flex min-w-0 flex-1 flex-col">
        <AdminHeader pathname={pathname} staffRole={staffRole} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
