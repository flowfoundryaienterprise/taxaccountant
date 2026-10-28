"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff, X } from "lucide-react";

import { demoMedia } from "@/lib/admin/admin-fixtures";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  /** Currently selected public path, if any. */
  value?: string;
  onChange: (path: string | undefined) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * Picks an existing approved asset for a featured image.
 *
 * Selection only — there is no upload control here, and that is deliberate.
 * The R2 integration does not exist (API.md section 5 describes the
 * intended presigned-upload protocol), so an upload button would either do
 * nothing or, worse, imply a file had been stored. The Media Library screen
 * carries the explanation of what upload will require.
 *
 * Only assets that already ship in `public/` are offered, so a selection can
 * never point at a private or unapproved file.
 */
export function MediaPicker({ value, onChange, label, hint, disabled }: MediaPickerProps) {
  const [failed, setFailed] = React.useState<string | null>(null);
  const images = demoMedia.filter((asset) => asset.contentType.startsWith("image/"));
  const selected = images.find((asset) => asset.path === value);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-compact font-medium text-navy">{label}</legend>
      {hint ? <p className="text-caption text-slate">{hint}</p> : null}

      {selected ? (
        <div className="flex items-center gap-3 rounded-card border border-border bg-white p-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-input bg-tint">
            {failed === selected.path ? (
              <span className="flex h-full w-full items-center justify-center text-slate">
                <ImageOff className="h-4 w-4" aria-hidden />
              </span>
            ) : (
              <Image
                src={selected.path}
                alt={selected.altText ?? ""}
                fill
                sizes="96px"
                className="object-cover"
                onError={() => setFailed(selected.path)}
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-caption font-medium text-navy">{selected.path}</p>
            <p className="truncate text-caption text-slate">
              {selected.altText ?? "No alt text recorded for this asset"}
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            aria-label="Remove selected image"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-control text-slate hover:bg-tint disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        role="radiogroup"
        aria-label={`${label} — choose an approved asset`}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {images.map((asset) => {
          const isSelected = asset.path === value;

          return (
            <button
              key={asset.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(isSelected ? undefined : asset.path)}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-input border-2 bg-tint transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
                isSelected ? "border-action" : "border-transparent hover:border-border",
              )}
            >
              {failed === asset.path ? (
                <span className="flex h-full w-full items-center justify-center text-slate">
                  <ImageOff className="h-4 w-4" aria-hidden />
                </span>
              ) : (
                <Image
                  src={asset.path}
                  alt={asset.altText ?? `Asset ${asset.objectKey}`}
                  fill
                  sizes="(min-width: 640px) 20vw, 45vw"
                  className="object-cover"
                  onError={() => setFailed(asset.path)}
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
