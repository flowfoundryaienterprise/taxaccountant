import type * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/**
 * lucide-react dropped brand/social glyphs entirely (checked: none exist in
 * the installed 1.x package). These are small generic hand-drawn monochrome
 * marks, not copies of any platform's official asset files.
 */
export function FacebookGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M14 8.5h2V5.5h-2.2C11.7 5.5 10.5 6.8 10.5 9v2H8.5v3h2V19h3v-5h2.2l.5-3H13.5V9.3c0-.5.3-.8.7-.8Z" />
    </svg>
  );
}

export function LinkedinGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 10.5v6M8 8v.01M12 16.5v-3.8c0-1.2.9-2.2 2.1-2.2 1.2 0 1.9.8 1.9 2.2v3.8" />
    </svg>
  );
}

export function XGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function InstagramGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.3" />
      <circle cx="16.3" cy="7.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="3" />
      <path d="M10.5 9.8v4.4l4-2.2-4-2.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
