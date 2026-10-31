import Image from "next/image";

import { cn } from "@/lib/utils";

interface CountryBadgeProps {
  code: string;
  /** Accessible name — pass the country name so the tile is not read as two letters. */
  countryName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Codes with a flag in `public/images/flags`. Lowercase ISO 3166-1 alpha-2,
 * matching the filenames.
 *
 * An explicit list rather than a bare `/images/flags/${code}.svg`: profile
 * locations carry whatever country code the record holds, so an unlisted
 * code must fall back to the lettered tile instead of requesting a file
 * that is not there and rendering a broken image. Add a country here only
 * once its SVG is committed and credited in `public/images/ATTRIBUTIONS.md`.
 */
const FLAG_CODES = new Set(["ae", "au", "ca", "de", "fr", "gb", "in", "jp", "sg", "us"]);

/**
 * Box per size. Flags are 1:2 (GB, AU, CA, AE), 3:5 (DE) or 2:3 (the rest),
 * so the box is 3:2 — the middle of that range — and the flag is contained
 * inside it. Containing rather than covering is deliberate: cropping a flag
 * to fill a box cuts the Union Jack out of the Australian canton and shaves
 * the US canton, which is exactly the detail that identifies the flag.
 *
 * The widths are the rendered pixel sizes passed to `next/image`, kept as a
 * number so the intrinsic size and the CSS box cannot drift apart.
 */
const SIZES: Record<NonNullable<CountryBadgeProps["size"]>, { box: string; width: number }> = {
  sm: { box: "h-6 w-9 text-caption", width: 36 },
  md: { box: "h-8 w-12 text-compact", width: 48 },
  lg: { box: "h-10 w-15 text-body", width: 60 },
};

/**
 * Country identity tile: the national flag where one is available, and the
 * ISO 3166-1 alpha-2 code where one is not.
 *
 * The flags are the public-domain Wikimedia Commons SVGs, committed under
 * `public/images/flags` and listed in `public/images/ATTRIBUTIONS.md`.
 * Deliberately **not** regional-indicator emoji: Windows has no flag glyphs
 * for them, so every one renders as a bare pair of letters there.
 *
 * Either branch is announced the same way — `role="img"` with the country
 * name and code — so a screen reader hears "United States (US)" whether or
 * not a flag file exists, and the two letters are never read as a word.
 */
export function CountryBadge({ code, countryName, size = "md", className }: CountryBadgeProps) {
  const { box, width } = SIZES[size];
  const upper = code.toUpperCase();
  const slug = code.toLowerCase();
  const hasFlag = FLAG_CODES.has(slug);

  return (
    <span
      role="img"
      aria-label={`${countryName} (${upper})`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-input border border-border",
        // The lettered fallback needs a fill and type styles; the flag is its
        // own artwork and gets neither. Both keep the border — without it the
        // flags with a white edge (JP, CA, IN) bleed into a white card.
        hasFlag ? "bg-white" : "bg-tint font-semibold tracking-wide text-navy",
        box,
        className,
      )}
    >
      {hasFlag ? (
        <Image
          src={`/images/flags/${slug}.svg`}
          alt=""
          width={width}
          height={Math.round((width * 2) / 3)}
          className="h-full w-full object-contain"
          aria-hidden
        />
      ) : (
        <span aria-hidden>{upper}</span>
      )}
    </span>
  );
}
