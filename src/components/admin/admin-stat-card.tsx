import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** What the number counts — never a trend, target or percentage change. */
  caption: string;
  href?: string;
  className?: string;
}

/**
 * An overview counter.
 *
 * Shows a count and says exactly what was counted. There is deliberately no
 * trend arrow, no "+12% this month" and no sparkline: the project stores no
 * history to compare against, so any movement indicator would be invented
 * (Day 6 brief section 5: "Do not display invented operational metrics as
 * production statistics").
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  caption,
  href,
  className,
}: AdminStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-slate">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-tint text-action">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="text-heading-lg font-semibold text-navy">{value}</p>
      <p className="text-caption text-slate">{caption}</p>
    </>
  );

  const shared =
    "flex flex-col gap-2 rounded-card border border-border bg-white p-5 transition-shadow duration-150";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(shared, "hover:shadow-[0_20px_40px_-32px_rgba(16,44,87,0.45)]", className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn(shared, className)}>{content}</div>;
}
