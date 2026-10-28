/**
 * TaxAccountant brand mark.
 *
 * A checkmark whose long arm keeps rising past the corner — "verified" and
 * "growth" in one shape, which is the whole proposition of a vetted tax
 * marketplace. A blue tile with a white glyph: the only combination in the
 * palette that stays legible at 16px against both a white page and dark
 * browser chrome.
 *
 * ## Why the tile is #0879E9 and `--color-action` is not, as of Day 9
 * These were the same value. The token was darkened to #076ed4 so that
 * white button labels and action-coloured links clear WCAG 2.2 AA (the old
 * value measured 4.27:1). A logotype carries **no** contrast requirement —
 * WCAG 1.4.3 exempts it explicitly — so the mark was left at the original
 * brand value rather than changed as a side effect of an accessibility fix.
 *
 * That is a deliberate divergence, not drift, and it is deliberately small:
 * the two blues differ by (1, 11, 21) of 255. Re-uniting them is a brand
 * decision, and it would mean regenerating the committed favicon and icon
 * binaries too. Tracked in docs/DAY9_QA_REPORT.md.
 *
 * Geometry **and tile colour** are kept identical to `public/favicon.svg`
 * and `scripts/generate-icons.mjs` — change one, change all three.
 */

interface BrandLogoProps {
  /** Rendered size in px. The artwork is a 32-unit square, so any size works. */
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="#0879E9" />
      <path
        d="M8.5 17 13.5 22 23.5 10.5"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
