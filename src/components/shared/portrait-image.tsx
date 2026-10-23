"use client";

import * as React from "react";
import Image from "next/image";

import { AvatarInitials } from "@/components/shared/avatar-initials";

interface PortraitImageProps {
  src: string;
  alt: string;
  initials?: string;
  accent?: "navy" | "action" | "slate";
  sizes?: string;
  className?: string;
}

function initialsFromAlt(alt: string): string {
  const words = alt.replace(/^Portrait of /i, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Falls back to the initials avatar if the photo fails to load (DESIGN.md
 * section 9: every async/remote-dependent view needs an error state, not a
 * broken image icon).
 */
export function PortraitImage({ src, alt, initials, accent = "navy", sizes, className }: PortraitImageProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div className={className}>
        <AvatarInitials initials={initials ?? initialsFromAlt(alt)} accent={accent} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
