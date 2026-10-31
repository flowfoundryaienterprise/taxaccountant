import Link from "next/link";

import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: number | string;
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
 *
 * The tinted icon tile is gone. A stat card is a label, a figure and what
 * the figure counts; a folder glyph beside "Service categories" repeats the
 * label in a picture and takes the eye away from the number, which is the
 * only thing on the card worth looking at. Removing it also lets six of
 * these sit as a compact band above the table rather than six boxes each
 * tall enough to hold an icon.
 *
 * The figure is mono and tabular so a column of counts aligns on its digits
 * and a three-digit value does not shift its neighbours.
 */
export function AdminStatCard({ label, value, caption, href, className }: AdminStatCardProps) {
  const content = (
    <>
      <p className="text-caption text-slate">{label}</p>
      <p className="font-mono text-heading-lg font-medium tabular-nums text-navy">{value}</p>
      <p className="text-caption text-slate">{caption}</p>
    </>
  );

  const shared = "flex flex-col gap-1.5 rounded-card border border-border bg-white p-4";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(shared, "transition-colors duration-150 hover:border-action", className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn(shared, className)}>{content}</div>;
}
