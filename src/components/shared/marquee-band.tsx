"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/shared/use-motion-safe";

interface MarqueeBandProps {
  children: React.ReactNode;
  className?: string;
  durationSeconds?: number;
}

/**
 * Seamless infinite horizontal band (jurisdiction codes, coverage counts).
 * Renders the content twice and translates by exactly -50%, so the loop
 * point is invisible regardless of content width — no `getBoundingClientRect`
 * measurement needed.
 *
 * Starts in the static (non-looping) branch unconditionally — on the
 * server, and on the client's first hydration pass — and only upgrades to
 * the looping version once `useMotionSafe()` (`@/components/shared/
 * use-motion-safe`, built on `useSyncExternalStore`) confirms it client-side.
 * Branching this on framer's `useReducedMotion()` directly used to read
 * `false` server-side and `true` (or vice versa) client-side in this
 * framework's streaming SSR, which renders a *different element tree* for
 * the two branches here (not just a different style) — React hard-fails
 * hydration rather than reconciling it. `useSyncExternalStore`'s
 * `getServerSnapshot` is what both the server and the client's first paint
 * read, so the hydration-checked markup is guaranteed identical.
 */
export function MarqueeBand({ children, className, durationSeconds = 28 }: MarqueeBandProps) {
  const looping = useMotionSafe();

  if (!looping) {
    return <div className={cn("flex items-center gap-10", className)}>{children}</div>;
  }

  return (
    <div className="flex overflow-hidden" aria-hidden={false}>
      <motion.div
        className={cn("flex shrink-0 items-center gap-10 pr-10", className)}
        animate={{ x: ["0%", "-100%"] }}
        transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className={cn("flex shrink-0 items-center gap-10 pr-10", className)}
        animate={{ x: ["0%", "-100%"] }}
        transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
      >
        {children}
      </motion.div>
    </div>
  );
}
