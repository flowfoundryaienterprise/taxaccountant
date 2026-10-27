/**
 * Skip-to-content link.
 *
 * WCAG 2.2 AA, and DESIGN.md section 10 lists it explicitly. Without one, a
 * keyboard or screen-reader user tabs through the entire header — brand,
 * seven nav items with dropdowns, locale selectors, two buttons — on every
 * single page before reaching the content.
 *
 * Visually hidden until focused, then pinned top-left above everything. It
 * is the first focusable element in the document, which is the only
 * position that makes it useful.
 */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-input focus:bg-action focus:px-4 focus:text-compact focus:font-medium focus:text-white focus:shadow-[0_12px_32px_-12px_rgba(16,44,87,0.6)]"
    >
      Skip to main content
    </a>
  );
}
