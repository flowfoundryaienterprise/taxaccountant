"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/shared/use-motion-safe";

interface MagneticCtaProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Cursor-pull wrapper for primary CTAs on the marketing site.
 *
 * `Reveal` (IntersectionObserver + CSS transition) is deliberately kept as
 * the zero-dependency default for simple fade/slide-ins — this component
 * exists only for the cursor-chase physics, which a CSS transition cannot
 * express: the target position changes on every `pointermove`, so the
 * transform needs a continuously-updated spring rather than a single
 * state-triggered one. `useMotionValue`/`useSpring` update the transform
 * outside React's render cycle, so the chase never triggers a re-render or
 * a layout pass — only `transform`, never `top`/`left`.
 *
 * Isolated as its own leaf client component (not the whole hero) so the
 * surrounding content stays static/server-rendered.
 *
 * ## Why `active` comes from `useMotionSafe()`, not `useReducedMotion()`
 * Framer's own `useReducedMotion()` resolves differently between this
 * framework's server-rendered pass and the client's first paint (there is
 * no `window` to read on the server, so it falls back to the
 * motion-sickness-safe default rather than matching the client) — feeding
 * that straight into `style={{ x, y }}` produced a real
 * `"Hydration failed because the server rendered HTML didn't match the
 * client"` error: the server emits `style={{}}`, the client's pre-hydration
 * render already resolves the spring to `style={{transform:"none"}}`.
 * `useMotionSafe` (`@/components/shared/use-motion-safe`) is built on
 * `useSyncExternalStore`, which guarantees the server render and the
 * client's first hydration pass both get its `getServerSnapshot` value —
 * the two renders the hydration check compares stay identical, and the
 * real client value only takes over afterward.
 */
export function MagneticCta({ children, className, strength = 0.35 }: MagneticCtaProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const active = useMotionSafe();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    x.set((event.clientX - (bounds.left + bounds.width / 2)) * strength);
    y.set((event.clientY - (bounds.top + bounds.height / 2)) * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={active ? { x: springX, y: springY } : undefined}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
