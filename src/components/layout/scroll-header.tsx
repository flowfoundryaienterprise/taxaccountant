"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shrinks and adds a blurred surface to the sticky header once the page has
 * scrolled past the hero — transform/opacity-adjacent (height + shadow, not
 * layout-thrashing top/left) per the performance guidance in
 * ARCHITECTURE.md section 5.
 */
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b transition-[box-shadow,border-color,background-color] duration-300",
        scrolled
          ? "border-border bg-white/85 shadow-[0_8px_24px_-16px_rgba(16,44,87,0.25)] backdrop-blur-md"
          : "border-transparent bg-white",
      )}
    >
      {children}
    </header>
  );
}
