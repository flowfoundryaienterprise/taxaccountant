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
      <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums text-navy">
        {value}
      </p>
      <p className="text-caption text-slate">{caption}</p>
    </>
  );

  /*
   * "Bento 2.0" surface per the redesign brief: bigger rounded corner,
   * a soft wide diffusion shadow instead of a hard edge, generous padding.
   * The content model is unchanged — label, figure, caption, nothing else —
   * no trend arrow or icon badge was added; see the file-level note above.
   */
  const shared = cn(
    "flex flex-col gap-2 rounded-[1.5rem] border border-border bg-white p-6",
    "shadow-[0_20px_40px_-28px_rgba(16,44,87,0.18)]",
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          shared,
          "transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-action hover:shadow-[0_24px_48px_-24px_rgba(16,44,87,0.22)] active:translate-y-0 active:scale-[0.99]",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn(shared, className)}>{content}</div>;
}
