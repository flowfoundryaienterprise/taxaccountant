import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * WCAG 2.2 AA contrast cover for the design tokens.
 *
 * Day 9 found `--color-action` at 4.27:1 against white — below the 4.5:1
 * normal-size text needs, which it is, because `buttonVariants` puts a white
 * label on it at `text-compact` (14px) for every primary button on the site.
 * A colour token is the kind of value that gets nudged for visual reasons by
 * someone who is not thinking about contrast, and nothing else in the
 * pipeline would object, so the ratios are asserted here.
 *
 * The tokens are read out of `globals.css` rather than duplicated, so this
 * tests the values the app actually ships.
 */

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:[ ]*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `--color-${name} not found in globals.css`);
  return match[1].toLowerCase();
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const AA_NORMAL = 4.5;
const AA_LARGE = 3;
/** WCAG 1.4.11, for the visual boundary / state of a UI component. */
const AA_NON_TEXT = 3;

const WHITE = "#ffffff";
/** Hover shades live as arbitrary values in `buttonVariants`, not as tokens. */
const ACTION_HOVER = "#075984";

test("body and secondary text clear AA on every surface", () => {
  for (const surface of [WHITE, token("tint"), token("canvas"), token("subtle")]) {
    assert.ok(contrast(token("navy"), surface) >= AA_NORMAL);
    assert.ok(contrast(token("slate"), surface) >= AA_NORMAL);
  }
});

test("action colour clears AA as text and as a button background", () => {
  const action = token("action");

  // Action-coloured links and section eyebrows.
  assert.ok(
    contrast(action, WHITE) >= AA_NORMAL,
    `action on white is ${contrast(action, WHITE).toFixed(2)}:1`,
  );
  assert.ok(
    contrast(action, token("tint")) >= AA_NORMAL,
    `action on tint is ${contrast(action, token("tint")).toFixed(2)}:1`,
  );

  /*
   * The CMS surfaces. The row-hover case is the one that fails first: a
   * table row's "Edit" link is action-coloured, and hovering the row swaps
   * white for `--color-subtle` underneath it.
   */
  for (const surface of [token("canvas"), token("subtle")]) {
    assert.ok(
      contrast(action, surface) >= AA_NORMAL,
      `action on ${surface} is ${contrast(action, surface).toFixed(2)}:1`,
    );
  }

  // Every primary button label, at 14px — normal-size text under WCAG.
  assert.ok(
    contrast(WHITE, action) >= AA_NORMAL,
    `white on action is ${contrast(WHITE, action).toFixed(2)}:1`,
  );

  // The hover state must stay legible and must stay darker, or the button
  // appears to light up on hover.
  assert.ok(
    contrast(WHITE, ACTION_HOVER) >= AA_NORMAL,
    `white on action hover is ${contrast(WHITE, ACTION_HOVER).toFixed(2)}:1`,
  );
  assert.ok(
    luminance(ACTION_HOVER) < luminance(action),
    "the hover shade must be darker than the base",
  );
});

test("status colours clear AA on white", () => {
  for (const name of ["success", "danger", "warning"]) {
    const value = token(name);
    assert.ok(
      contrast(value, WHITE) >= AA_NORMAL,
      `${name} on white is ${contrast(value, WHITE).toFixed(2)}:1`,
    );
  }
});

test("the focus ring is visible against every surface it lands on", () => {
  const focus = token("focus");
  for (const surface of [WHITE, token("tint")]) {
    assert.ok(contrast(focus, surface) >= AA_NON_TEXT);
  }
});

test("a control boundary clears the 3:1 non-text threshold", () => {
  // WCAG 1.4.11. `--color-control` is the border on inputs, selects and any
  // button whose fill does not separate it from the page, so it is the only
  // thing marking where the control is. It has to clear 3:1 against both
  // surfaces a control sits on.
  const control = token("control");

  assert.ok(
    contrast(control, WHITE) >= AA_NON_TEXT,
    `control border on white is ${contrast(control, WHITE).toFixed(2)}:1`,
  );
  assert.ok(
    contrast(control, token("tint")) >= AA_NON_TEXT,
    `control border on tint is ${contrast(control, token("tint")).toFixed(2)}:1`,
  );

  // It must stay lighter than body text, or a field outline competes with
  // the value typed into it.
  assert.ok(
    luminance(control) > luminance(token("slate")),
    "the control border must stay lighter than --color-slate",
  );

  // And the decorative token is deliberately NOT held to this: it draws
  // card edges and dividers, which 1.4.11 does not cover. Asserted so that
  // "fix the contrast" is never read as "darken every border on the site".
  assert.ok(
    contrast(token("border"), WHITE) < AA_NON_TEXT,
    "--color-border is the decorative token; if it now passes 3:1 the two have been merged",
  );
});

test("the error state stays distinguishable on a control", () => {
  assert.ok(contrast(token("danger"), WHITE) >= AA_NON_TEXT);
});

test("the checkbox accent is distinguishable from its white field", () => {
  // `accent-action` colours the checked state; 1.4.11 governs it.
  assert.ok(contrast(token("action"), WHITE) >= AA_NON_TEXT);
});

test("large-text and non-text uses of the tint surface still separate", () => {
  assert.ok(contrast(token("navy"), token("tint")) >= AA_LARGE);
});
