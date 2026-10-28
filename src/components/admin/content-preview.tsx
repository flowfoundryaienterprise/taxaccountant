"use client";

import * as React from "react";
import Image from "next/image";
import { EyeOff, Monitor, ShieldAlert, Smartphone } from "lucide-react";

import { ContentBlocks } from "@/components/shared/content-blocks";
import {
  TAX_CONTENT_DISCLAIMER,
  contentDateline,
  jurisdictionNotice,
} from "@/lib/cms/content-formatters";
import { statusVisibility, type EditorialStatus } from "@/lib/cms/content-status";
import type { CmsBlock } from "@/lib/cms/content-types";
import { cn } from "@/lib/utils";

interface ContentPreviewProps {
  status: EditorialStatus;
  title: string;
  excerpt?: string;
  body: CmsBlock[];
  category?: string;
  jurisdictionLabel?: string;
  featuredImage?: { path: string; alt: string };
  author?: string;
  reviewer?: string;
  reviewedAt?: string;
  publishedAt?: string;
  /** Articles carry the tax disclaimer; plain pages do not. */
  showDisclaimer?: boolean;
}

/**
 * Editor-local preview of the current form state.
 *
 * ## Security: no preview URL exists
 * This renders **inside the editor**, from props already held in that
 * form's React state. There is deliberately no `/preview/[token]` route and
 * no shareable draft link: an unauthenticated URL that renders unpublished
 * content is a content leak with extra steps, and the Day 7 brief rules it
 * out directly ("Do not create unrestricted public preview URLs for draft
 * content"). When an authorized preview mechanism exists it will need a
 * server-side permission check of its own.
 *
 * Nothing administrative is rendered into the markup — no status field, no
 * editor identity, no internal note. The draft banner is chrome around the
 * preview, outside the previewed region.
 *
 * ## Fidelity
 * The body is rendered by the same `ContentBlocks` component the public
 * resource pages use, so what an editor sees is what a reader would get. The
 * viewport toggle constrains width only; it does not switch to a different
 * layout, because the public page is itself responsive and the narrow view
 * is the same markup at a smaller size.
 */
export function ContentPreview({
  status,
  title,
  excerpt,
  body,
  category,
  jurisdictionLabel,
  featuredImage,
  author,
  reviewer,
  reviewedAt,
  publishedAt,
  showDisclaimer = true,
}: ContentPreviewProps) {
  const [viewport, setViewport] = React.useState<"desktop" | "mobile">("desktop");
  const [imageFailed, setImageFailed] = React.useState(false);

  const dateline = contentDateline({ publishedAt, reviewedAt });
  const isLive = status === "published";

  return (
    <section
      aria-labelledby="content-preview-heading"
      className="flex flex-col gap-4 rounded-card border border-border bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="content-preview-heading" className="text-compact font-semibold text-navy">
          Preview
        </h2>

        <div
          role="group"
          aria-label="Preview width"
          className="flex items-center gap-1 rounded-input border border-border p-1"
        >
          {(
            [
              { value: "desktop", label: "Desktop", icon: Monitor },
              { value: "mobile", label: "Mobile", icon: Smartphone },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewport(option.value)}
              aria-pressed={viewport === option.value}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-[6px] px-3 text-caption font-medium transition-colors duration-150",
                viewport === option.value
                  ? "bg-tint text-action"
                  : "text-slate hover:bg-tint/60",
              )}
            >
              <option.icon className="h-3.5 w-3.5" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outside the previewed region: chrome, not content. */}
      {!isLive ? (
        <p className="flex gap-2 rounded-card border border-warning/40 bg-white px-4 py-3 text-caption text-slate">
          <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            <strong className="font-semibold text-navy">Draft preview.</strong>{" "}
            {statusVisibility(status)} This is how the content would appear if published — it is
            not reachable by anyone outside this editor, and no preview URL exists.
          </span>
        </p>
      ) : null}

      {!reviewer || !reviewedAt ? (
        <p className="flex gap-2 rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            No editorial review is recorded, so this content is not eligible for publication
            regardless of how the preview looks.
          </span>
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-card border border-border bg-tint/30 p-4">
        <article
          className={cn(
            "mx-auto flex flex-col gap-5 rounded-card bg-white p-6 transition-[max-width] duration-200",
            viewport === "mobile" ? "max-w-[375px]" : "max-w-[720px]",
          )}
        >
          {category || jurisdictionLabel ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {category ? (
                <span className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy">
                  {category}
                </span>
              ) : null}
              {jurisdictionLabel ? (
                <span className="rounded-full border border-border px-2.5 py-1 text-caption font-medium text-slate">
                  {jurisdictionLabel}
                </span>
              ) : null}
            </div>
          ) : null}

          {/*
            An `h2`, not an `h1`, even though the public page renders this as
            its `h1`. The preview is nested inside an editor screen that
            already owns the page's single `h1`, and a second one breaks the
            document outline for anyone navigating by headings. The visual
            treatment is unchanged, so the preview still reads correctly —
            fidelity of appearance does not require duplicating a landmark
            heading.
          */}
          <h2 className="text-heading-lg font-semibold text-navy">
            {title.trim() || "Untitled"}
          </h2>

          {excerpt?.trim() ? (
            <p className="text-lead text-slate">{excerpt}</p>
          ) : null}

          {/* Publish date and review date are reported separately, never
              merged — for tax content the gap between them is information. */}
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-caption text-slate">
            {author ? (
              <div className="flex gap-1">
                <dt>Written by</dt>
                <dd className="font-medium text-navy">{author}</dd>
              </div>
            ) : null}
            <div className="flex gap-1">
              <dt>Published</dt>
              <dd className="font-medium text-navy">{dateline.published ?? "Not published"}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Last reviewed</dt>
              <dd className={cn("font-medium", dateline.unreviewed ? "text-warning" : "text-navy")}>
                {dateline.reviewed ?? "Not reviewed"}
                {reviewer && dateline.reviewed ? ` by ${reviewer}` : ""}
              </dd>
            </div>
          </dl>

          {featuredImage?.path ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-tint">
              {imageFailed ? (
                <span className="flex h-full w-full items-center justify-center text-caption text-slate">
                  Image unavailable
                </span>
              ) : (
                <Image
                  src={featuredImage.path}
                  alt={featuredImage.alt}
                  fill
                  sizes="720px"
                  className="object-cover"
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          ) : null}

          {body.length ? (
            <ContentBlocks blocks={body} />
          ) : (
            <p className="text-compact text-slate">
              No content blocks yet. Add some in the editor to see them here.
            </p>
          )}

          {jurisdictionLabel ? (
            <p className="rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate">
              {jurisdictionNotice(jurisdictionLabel)}
            </p>
          ) : null}

          {showDisclaimer ? (
            <p className="border-t border-border pt-4 text-caption text-slate">
              {TAX_CONTENT_DISCLAIMER}
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
