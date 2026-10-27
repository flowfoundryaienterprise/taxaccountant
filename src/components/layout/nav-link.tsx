"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  label: string;
  href: string;
  /**
   * Also treat `/href/...` as active. Off for `/` so the homepage link is
   * not permanently highlighted.
   */
  matchNested?: boolean;
  className?: string;
}

/** True when `pathname` is `href`, or a child of it when nesting is allowed. */
export function isActivePath(pathname: string, href: string, matchNested: boolean): boolean {
  const base = href.split(/[?#]/)[0];
  if (base === "/") return pathname === "/";
  if (pathname === base) return true;
  return matchNested && pathname.startsWith(`${base}/`);
}

/**
 * Primary nav item with active-page indication.
 *
 * The underline is the same element the hover state animates, so an active
 * item simply starts at full width instead of growing — one visual
 * language, not two. `aria-current="page"` carries the same information to
 * assistive technology, which the colour alone would not.
 */
export function NavLink({ label, href, matchNested = true, className }: NavLinkProps) {
  const pathname = usePathname() ?? "/";
  const active = isActivePath(pathname, href, matchNested);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative whitespace-nowrap text-compact font-medium transition-colors duration-150 hover:text-action",
        active ? "text-action" : "text-navy",
        className,
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-0.5 bg-action transition-[width] duration-200",
          active ? "w-full" : "w-0 group-hover:w-full",
        )}
      />
    </Link>
  );
}
