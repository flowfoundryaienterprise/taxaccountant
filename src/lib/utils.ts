import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom scales declared in `@theme` (see `src/app/globals.css`).
 *
 * ## Why tailwind-merge has to be told about these
 * tailwind-merge ships a static map of Tailwind's *default* scales. It
 * cannot read `@theme`, so a Tailwind v4 custom token is unknown to it, and
 * for a `text-*` class the fallback classification is **text colour** —
 * `text-compact` and `text-navy` therefore looked like two colours in one
 * conflict group, and the later one won.
 *
 * Measured before this fix (Day 9): `cn()` silently dropped a class at 26
 * call sites, and every `buttonVariants()` button lost the `text-compact`
 * in its base layer to the `text-white` / `text-navy` in its variant layer,
 * so every button in the app rendered at the inherited 1rem instead of the
 * intended 0.875rem. The classes were correct in the source and absent from
 * the rendered `class` attribute, which is why it survived code review.
 *
 * Registering the scales restores the intended semantics: a size conflicts
 * only with a size, a colour only with a colour, and the last one wins.
 *
 * Radii are listed for the same reason. No call site currently passes two
 * radii, so this changes no output today — it stops the same silent failure
 * happening the first time one does.
 *
 * **Keep in sync with the `@theme` block in `globals.css`.** A token added
 * there and not here is not a build error; it is a class that quietly stops
 * applying.
 */
const FONT_SIZE_TOKENS = [
  "caption",
  "compact",
  "body",
  "lead",
  "heading-sm",
  "heading-lg",
  "hero",
];

const RADIUS_TOKENS = ["input", "card", "panel"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZE_TOKENS }],
      rounded: [{ rounded: RADIUS_TOKENS }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
