"use client";

import { Globe2 } from "lucide-react";

import { AdminTextArea, AdminTextField } from "@/components/admin/admin-form-field";
import {
  SEO_DESCRIPTION_PIXEL_GUIDE,
  SEO_TITLE_PIXEL_GUIDE,
} from "@/lib/admin/admin-formatters";
import { LIMITS } from "@/lib/admin/admin-validation";
import { cn } from "@/lib/utils";

export interface SeoFieldValues {
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
}

interface SeoFieldsProps {
  values: SeoFieldValues;
  onChange: (patch: Partial<SeoFieldValues>) => void;
  errors?: Partial<Record<keyof SeoFieldValues, string>>;
  /** Falls back into the preview when no SEO title has been written. */
  fallbackTitle: string;
  disabled?: boolean;
}

const SITE_ORIGIN = "https://taxaccountant.com";

/**
 * SEO title, meta description, canonical path, plus a search-appearance
 * preview.
 *
 * Shared by the page and article editors so the limits, the hints and the
 * preview can never diverge between them.
 *
 * The preview shows the **fallback** when a field is empty, which is what a
 * search engine would actually display, rather than showing an empty line
 * and implying the result would be blank.
 */
export function SeoFields({
  values,
  onChange,
  errors = {},
  fallbackTitle,
  disabled,
}: SeoFieldsProps) {
  const previewTitle = values.seoTitle.trim() || fallbackTitle;
  const previewDescription = values.seoDescription.trim();
  const previewPath = values.canonicalPath.trim() || "/…";

  const titleOver = previewTitle.length > SEO_TITLE_PIXEL_GUIDE;
  const descriptionOver = previewDescription.length > SEO_DESCRIPTION_PIXEL_GUIDE;

  return (
    <fieldset className="flex flex-col gap-5 rounded-card border border-border bg-white p-5">
      <legend className="px-1 text-compact font-semibold text-navy">Search engine metadata</legend>

      <AdminTextField
        id="seo-title"
        label="SEO title"
        value={values.seoTitle}
        onChange={(value) => onChange({ seoTitle: value })}
        error={errors.seoTitle}
        maxLength={LIMITS.seoTitle}
        disabled={disabled}
        placeholder={fallbackTitle}
        hint={`Falls back to the content title when empty. Around ${SEO_TITLE_PIXEL_GUIDE} characters display before most search engines truncate.`}
      />

      <AdminTextArea
        id="seo-description"
        label="Meta description"
        rows={3}
        value={values.seoDescription}
        onChange={(value) => onChange({ seoDescription: value })}
        error={errors.seoDescription}
        maxLength={LIMITS.seoDescription}
        disabled={disabled}
        hint={`Around ${SEO_DESCRIPTION_PIXEL_GUIDE} characters display. Describe the page honestly — this is not a keyword field.`}
      />

      <AdminTextField
        id="seo-canonical"
        label="Canonical path"
        value={values.canonicalPath}
        onChange={(value) => onChange({ canonicalPath: value })}
        error={errors.canonicalPath}
        disabled={disabled}
        placeholder="/services/example"
        hint="Site-relative path. One canonical address per piece of content — duplicates split ranking and confuse crawlers."
      />

      <div className="flex flex-col gap-2 rounded-card border border-border bg-tint/40 p-4">
        <p className="flex items-center gap-1.5 text-caption font-semibold text-navy">
          <Globe2 className="h-3.5 w-3.5 text-action" aria-hidden />
          Search appearance preview
        </p>

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-caption text-success">
            {SITE_ORIGIN}
            {previewPath}
          </p>
          <p
            className={cn(
              "min-w-0 truncate text-compact font-medium",
              titleOver ? "text-warning" : "text-action",
            )}
          >
            {previewTitle}
          </p>
          <p
            className={cn(
              "min-w-0 text-caption",
              descriptionOver ? "text-warning" : "text-slate",
            )}
          >
            {previewDescription || "No meta description — search engines will choose their own excerpt."}
          </p>
        </div>

        {titleOver || descriptionOver ? (
          <p className="text-caption text-warning">
            {titleOver ? "Title" : "Description"} is longer than the usual display limit and will
            likely be truncated.
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
