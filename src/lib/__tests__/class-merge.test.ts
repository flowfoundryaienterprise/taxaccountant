import test from "node:test";
import assert from "node:assert/strict";

import { cn } from "@/lib/utils";

/**
 * Regression cover for the Day 9 class-merging defect.
 *
 * tailwind-merge only knows Tailwind's *default* scales. It cannot read the
 * `@theme` block in `globals.css`, so every custom `text-*` size looked like
 * a text colour, landed in the colour conflict group, and was deleted by the
 * next real colour in the same `cn()` call. The classes were present in the
 * source and absent from the DOM — nothing failed, the type checker was
 * happy, and every button in the app silently rendered at the inherited
 * 1rem instead of `text-compact`'s 0.875rem.
 *
 * These assertions are the thing that would have caught it, and the thing
 * that will catch the next `@theme` token added without registering it in
 * `@/lib/utils`.
 */

const FONT_SIZES = [
  "text-caption",
  "text-compact",
  "text-body",
  "text-lead",
  "text-heading-sm",
  "text-heading-lg",
  "text-hero",
] as const;

const COLORS = ["text-navy", "text-white", "text-slate", "text-action", "text-slate/50"] as const;

test("a custom font size survives alongside every brand text colour", () => {
  for (const size of FONT_SIZES) {
    for (const color of COLORS) {
      const merged = cn(size, color).split(" ");
      assert.ok(merged.includes(size), `${size} was dropped by ${color}`);
      assert.ok(merged.includes(color), `${color} was dropped by ${size}`);
    }
  }
});

test("the button base keeps its size through a variant's colour", () => {
  // The exact shape of `cn(buttonVariants(...))`: a base layer carrying the
  // size, then a variant layer carrying the colour.
  const merged = cn(
    "inline-flex rounded-input text-compact font-medium",
    "bg-action text-white hover:bg-[#0668c7]",
  ).split(" ");

  assert.ok(merged.includes("text-compact"));
  assert.ok(merged.includes("text-white"));
});

test("two font sizes still conflict, last one wins", () => {
  assert.equal(cn("text-compact", "text-body"), "text-body");
  assert.equal(cn("text-sm", "text-compact"), "text-compact");
  assert.equal(cn("text-compact", "text-sm"), "text-sm");
});

test("two colours still conflict, last one wins", () => {
  assert.equal(cn("text-navy", "text-action"), "text-action");
});

test("custom radii conflict with each other and with built-ins", () => {
  assert.equal(cn("rounded-input", "rounded-card"), "rounded-card");
  assert.equal(cn("rounded-card", "rounded-full"), "rounded-full");
  assert.equal(cn("rounded-full", "rounded-panel"), "rounded-panel");
});

test("unrelated text utilities are left alone", () => {
  const merged = cn("text-center text-compact text-navy").split(" ");
  assert.deepEqual(merged.sort(), ["text-center", "text-compact", "text-navy"].sort());
});

test("conditional overrides still work as written", () => {
  // nav-link.tsx: base size + active/inactive colour.
  const navLink = (active: boolean) =>
    cn("text-compact font-medium", active ? "text-action" : "text-navy");

  assert.equal(navLink(true), "text-compact font-medium text-action");
  assert.equal(navLink(false), "text-compact font-medium text-navy");
});
