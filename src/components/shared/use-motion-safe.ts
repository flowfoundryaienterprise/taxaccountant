import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return !window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  // No `window` to read on the server, and this same value is what React
  // uses for the client's first hydration pass — so it must be the safe
  // default (motion off) rather than a guess, or the two renders diverge.
  return false;
}

/**
 * Whether perpetual/cursor-driven motion is safe to run: `true` once the
 * client has confirmed `prefers-reduced-motion` is not set.
 *
 * `useSyncExternalStore`, not `useState` + `useEffect`: reading
 * `window.matchMedia` is subscribing to state that lives outside React, and
 * `getServerSnapshot` is exactly React's built-in answer for "what do I
 * render before I can know the real value" — it is used for the server
 * render and for the client's first hydration pass, which is also what
 * closed the hydration-mismatch bug this used to have when the two
 * components below branched directly on framer-motion's `useReducedMotion()`
 * (that hook disagreed between this framework's server pass and the
 * client's first paint). A manual `useEffect` calling `setState` on mount
 * works too, but is flagged by `react-hooks/set-state-in-effect` for good
 * reason — it is React telling you the subscription primitive already
 * exists and does this correctly.
 */
export function useMotionSafe(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
