/**
 * TaxAccountant brand mark.
 *
 * A navy shield carrying a gold check: verified filing, which is the whole
 * proposition of a vetted tax marketplace.
 *
 * ## Why this is the simplified mark
 * The master artwork (`public/logo.png`, 1254px) puts a document inside the
 * shield — four gold bullet squares and four navy text bars above the
 * check. That reads at poster size and falls apart below roughly 64px: at
 * the 32px this component renders, the bars and bullets collapse into a
 * grey smudge and the shield stops reading as a shield.
 *
 * So every small size carries the mark reduced to what survives, in the
 * same two brand colours and the same silhouette. The outline measured
 * against the master is within 0.022 of the mark's width at its worst row,
 * which is 0.7px at 32px — the two are the same shape at any size this
 * renders. Use the master artwork wherever the mark is shown large.
 *
 * ## Colour
 * The master's navy measures #082E5B, 1.02:1 from `--color-navy` — the same
 * navy to any eye. The token value is used instead so the mark and the
 * interface cannot drift apart. Gold is #CB9F36, sampled from the master,
 * and measures 5.63:1 against this navy.
 *
 * This replaces the previous mark, a blue rounded tile with a white check,
 * and with it the Day 9 divergence where the tile kept #0879E9 after
 * `--color-action` was darkened to #076ed4 for AA. There is no divergence
 * now: the mark is navy, the accent is action blue, and they are separate
 * colours doing separate jobs.
 *
 * Geometry **and colours** are generated into `public/favicon.svg` and the
 * raster icons by `scripts/generate-icons.mjs` from its own constants. The
 * path below is the same one that script emits — if you change the mark,
 * change it there and paste the emitted path here.
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
      <path
        d="M16 2.4 C15.3 2.6 13.6 3.3 11.94 4.48 C10.28 5.66 5.4 6.6 4.83 8 L4.83 16.6 C4.83 22 9.4 26.6 16 29.4 C22.6 26.6 27.17 22 27.17 16.6 L27.17 8 C26.6 6.6 21.72 5.66 20.06 4.48 C18.4 3.3 16.7 2.6 16 2.4Z"
        fill="#102C57"
      />
      <path
        d="M10.6 16 14.2 19.8 21.6 10.6"
        fill="none"
        stroke="#CB9F36"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
