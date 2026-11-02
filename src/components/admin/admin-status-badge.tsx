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
  const resolvedTone = tone ?? statusTone(status);
  // A breathing dot only on the tone that actually means "live" — the
  // motion reports a real fact (published, visible to the public) rather
  // than decorating every chip the same way.
  const isLive = resolvedTone === "success";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-caption font-medium",
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full bg-current", isLive ? "animate-pulse-soft" : "opacity-70")}
      />
      {label ?? statusLabel(status)}
    </span>
  );
}
