import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Guards the cascade-layer contract of `globals.css`.
 *
 * Tailwind v4 emits everything it generates as `@layer theme, base,
 * components, utilities`. CSS ranks *unlayered* declarations above every
 * layered one no matter the specificity, so an element rule written at the
 * top level of this file silently outranks every Tailwind utility.
 *
 * Day 9 measured the damage: a top-level `a { color: inherit }` beat the
 * `text-*` utility on 38 of the 63 anchors on the homepage that carry one.
 * `buttonVariants` puts `text-white` on a `<Link>`, so every primary button
 * rendered a navy label on the action-blue fill — 2.76:1, against the 5.01:1
 * the markup asked for. Nothing failed: the class was in the DOM and the
 * rule was in the stylesheet, and the cascade discarded it anyway.
 *
 * These read the real file, so re-introducing a bare element rule outside
 * `@layer base` fails here instead of in someone's eyes.
 */

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/**
 * The file with comments and every at-rule block removed — `@layer` (the
 * thing being tested for), plus `@theme`, `@media` and `@keyframes`, whose
 * innards are custom properties and keyframe stops rather than element
 * rules and would otherwise read as false positives.
 */
function unlayeredSource(source: string): string {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const opener = /@[a-zA-Z-]+[^{;]*\{/;

  let out = "";
  let index = 0;

  while (index < withoutComments.length) {
    const rest = withoutComments.slice(index);
    const match = opener.exec(rest);
    if (!match) {
      out += rest;
      break;
    }

    out += rest.slice(0, match.index);

    // Walk to the brace that closes this layer block.
    let cursor = match.index + match[0].length;
    let depth = 1;
    while (cursor < rest.length && depth > 0) {
      const char = rest[cursor];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      cursor += 1;
    }
    index += cursor;
  }

  return out;
}

const BASE_SELECTORS = [":root", "body", "a", ":focus-visible"];

test("the element defaults live inside @layer base", () => {
  const baseBlock = /@layer[ \t]+base[ \t]*\{([\s\S]*)\n\}/.exec(css);
  assert.ok(baseBlock, "globals.css has no @layer base block");

  for (const selector of BASE_SELECTORS) {
    assert.ok(
      baseBlock[1].includes(`${selector} {`),
      `${selector} must be declared inside @layer base, or it outranks every Tailwind utility`,
    );
  }
});

test("no bare element or pseudo-class rule is left unlayered", () => {
  const unlayered = unlayeredSource(css);

  // Anything that is not a class selector and not an at-rule would beat a
  // utility from outside a layer. `.animate-*` class rules are deliberately
  // allowed through: those are this project's own utilities, and they are
  // meant to win.
  const offenders = [...unlayered.matchAll(/(?:^|\})[\s]*([a-z:][a-zA-Z0-9:()-]*)[\s]*\{/g)]
    .map((match) => match[1])
    .filter((selector) => BASE_SELECTORS.includes(selector) || /^[a-z]+$/.test(selector));

  assert.deepEqual(
    offenders,
    [],
    `left outside @layer base, these override Tailwind utilities: ${offenders.join(", ")}`,
  );
});

test("the reduced-motion override stays unlayered and important", () => {
  // The deliberate exception: this one *must* outrank utilities, because it
  // is an accessibility override rather than a default.
  const block = /@media[^{]*prefers-reduced-motion[^{]*\{[\s\S]*?\n\}/.exec(css);
  assert.ok(block, "the prefers-reduced-motion block is missing");

  for (const property of ["animation-duration", "transition-duration", "scroll-behavior"]) {
    assert.ok(
      new RegExp(`${property}:[^;]*!important`).test(block[0]),
      `${property} must stay !important so it cannot be outranked`,
    );
  }
});
