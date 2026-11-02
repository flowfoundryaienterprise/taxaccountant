import * as React from "react";

import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Primary/secondary controls, usually a disabled create action. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The heading block every CMS screen opens with.
 *
 * Carries the screen's `<h1>` — each admin route has exactly one, and the
 * shell deliberately contributes none, so heading order stays correct as
 * screens are composed.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">{title}</h1>
        {description ? (
          <p className="max-w-[78ch] text-compact text-slate">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
