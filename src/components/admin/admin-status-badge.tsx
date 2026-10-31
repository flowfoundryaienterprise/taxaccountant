import { statusLabel, statusTone } from "@/lib/admin/admin-formatters";
import type { StatusTone } from "@/lib/admin/admin-types";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-border bg-subtle text-slate",
  info: "border-action/30 bg-tint text-action",
  success: "border-success/30 bg-white text-success",
  warning: "border-warning/30 bg-white text-warning",
  danger: "border-danger/30 bg-white text-danger",
};

interface AdminStatusBadgeProps {
  status: string;
  /** Override the derived label, e.g. "Discoverable" for a boolean column. */
  label?: string;
  /** Override the derived tone. */
  tone?: StatusTone;
  className?: string;
}

/**
 * One status chip for every CMS table.
 *
 * Colour is never the only signal — each badge carries its own text label
 * (DESIGN.md section 2: "Never use color alone to convey status"), which
 * also keeps the chips legible to screen readers without extra markup.
 */
export function AdminStatusBadge({ status, label, tone, className }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-caption font-medium",
        TONE_CLASSES[tone ?? statusTone(status)],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? statusLabel(status)}
    </span>
  );
}
