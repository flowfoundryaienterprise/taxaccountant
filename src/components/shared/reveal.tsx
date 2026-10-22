"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Lightweight scroll-reveal using IntersectionObserver — no animation
 * library dependency (AGENTS.md section 3: "never add dependencies without
 * documenting why standard APIs are inadequate"). Respects
 * prefers-reduced-motion via the global rule in globals.css, which forces
 * the transition duration to ~0.
 */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
