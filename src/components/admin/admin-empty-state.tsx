import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * "Nothing here" for a CMS surface.
 *
 * Distinct from the public `EmptyState`: that one is a marketing surface
 * with call-to-action buttons, while this sits inside a table card and
 * explains an editorial state to a staff reader. It never offers an action
 * that cannot be performed, so it takes no `actions` prop at all.
 */
export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-action">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex max-w-[56ch] flex-col gap-1.5">
        <h3 className="text-compact font-medium text-navy">{title}</h3>
        <p className="text-caption text-slate">{description}</p>
      </div>
      {children}
    </div>
  );
}
