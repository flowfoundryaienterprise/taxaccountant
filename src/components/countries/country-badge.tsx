import { cn } from "@/lib/utils";

interface CountryBadgeProps {
  code: string;
  /** Accessible name — pass the country name so the tile is not read as two letters. */
  countryName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<CountryBadgeProps["size"]>, string> = {
  sm: "h-7 w-9 text-caption",
  md: "h-9 w-12 text-compact",
  lg: "h-12 w-16 text-body",
};

/**
 * Country identity tile.
 *
 * Deliberately **not** a flag emoji and not a bundled flag image set:
 * regional-indicator emoji render as bare letter pairs on Windows, and no
 * licensed, attributed flag asset set exists in `public/images` yet
 * (ATTRIBUTIONS.md lists every asset this project ships). An ISO 3166-1
 * alpha-2 tile renders identically on every platform, is never a broken
 * image, and carries real information.
 *
 * Replace the inner span with an `<Image>` once a licensed flag set is added
 * and attributed; the call sites and layout do not change.
 */
export function CountryBadge({ code, countryName, size = "md", className }: CountryBadgeProps) {
  return (
    <span
      role="img"
      aria-label={`${countryName} (${code.toUpperCase()})`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-input border border-border bg-tint font-semibold tracking-wide text-navy",
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden>{code.toUpperCase()}</span>
    </span>
  );
}
