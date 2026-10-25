/**
 * TaxAccountant brand mark.
 *
 * A checkmark whose long arm keeps rising past the corner — "verified" and
 * "growth" in one shape, which is the whole proposition of a vetted tax
 * marketplace. Action blue `#0879E9` tile with a white glyph: the signature
 * brand color (DESIGN.md section 2), and the only combination in the palette
 * that stays legible at 16px against both a white page and dark browser
 * chrome.
 *
 * Geometry is kept identical to `public/favicon.svg` and
 * `scripts/generate-icons.mjs` — change one, change all three.
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
