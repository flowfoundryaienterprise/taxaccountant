import { cn } from "@/lib/utils";

const ACCENT_CLASSES = {
  navy: "bg-navy text-white",
  action: "bg-action text-white",
  slate: "bg-slate text-white",
} as const;

interface AvatarInitialsProps {
  initials: string;
  accent: keyof typeof ACCENT_CLASSES;
  className?: string;
}

/**
 * No stock photography and no generic "egg" person icon — a deterministic
 * initials avatar keeps demo professional cards honest about not being real
 * photographs while still reading as a considered design decision.
 */
export function AvatarInitials({ initials, accent, className }: AvatarInitialsProps) {
  return (
    <span
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lead font-semibold",
        ACCENT_CLASSES[accent],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
