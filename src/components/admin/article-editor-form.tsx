"use client";

import * as React from "react";
import Link from "next/link";
import { Save, ShieldAlert, Wand2 } from "lucide-react";

import {
  AdminSelectField,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-form-field";
import { ContentEditor } from "@/components/admin/content-editor";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoFields } from "@/components/admin/seo-fields";
import { articleCategories } from "@/lib/admin/admin-fixtures";
import { toSlug } from "@/lib/admin/admin-formatters";
import { LIMITS, errorFor, validateArticleForm } from "@/lib/admin/admin-validation";
import type { AdminArticleRow, ContentBlock } from "@/lib/admin/admin-types";

interface ArticleEditorFormProps {
  record?: AdminArticleRow;
  existingSlugs: string[];
  /** Jurisdiction options, so a jurisdiction-specific article can be scoped. */
  jurisdictions: { value: string; label: string }[];
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

/**
 * Create / edit form for an article or resource.
 *
 * Beyond the page editor it adds the three things tax content needs:
 * a category, an optional tax jurisdiction so a jurisdiction-specific piece
 * is never shown as universal, and explicit reviewer attribution.
 *
 * The reviewer fields are **read-only**. A review is an event that a
 * reviewer performs, not a text box an author fills in on their own behalf —
 * letting an author type their own reviewer's name would make the
 * attribution worthless. They are displayed from the record and would be
 * written by an authorized review action.
 */
export function ArticleEditorForm({
  record,
  existingSlugs,
  jurisdictions,
}: ArticleEditorFormProps) {
  const isNew = !record;

  const [title, setTitle] = React.useState(record?.title ?? "");
  const [slug, setSlug] = React.useState(record?.slug ?? "");
  const [excerpt, setExcerpt] = React.useState(record?.excerpt ?? "");
  const [category, setCategory] = React.useState(record?.category ?? "");
  const [jurisdiction, setJurisdiction] = React.useState(record?.jurisdictionCode ?? "");
  const [status, setStatus] = React.useState(record?.status ?? "draft");
  const [author, setAuthor] = React.useState(record?.author ?? "");
  const [blocks, setBlocks] = React.useState<ContentBlock[]>(record?.body ?? []);
  const [image, setImage] = React.useState<string | undefined>(record?.featuredImage?.path);
  const [imageAlt, setImageAlt] = React.useState(record?.featuredImage?.alt ?? "");
  const [seo, setSeo] = React.useState({
    seoTitle: record?.seo.title ?? "",
    seoDescription: record?.seo.description ?? "",
    canonicalPath: record?.seo.canonicalPath ?? "",
  });

  const [result, setResult] = React.useState<ReturnType<typeof validateArticleForm>>();

  const otherSlugs = React.useMemo(
    () => existingSlugs.filter((entry) => entry !== record?.slug),
    [existingSlugs, record?.slug],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(
      validateArticleForm(
        {
          title,
          slug,
          summary: excerpt,
          excerpt,
          category,
          imageAlt,
          hasImage: Boolean(image),
          ...seo,
        },
        otherSlugs,
      ),
    );
  };

  const invalid = result && !result.ok;
  const reviewed = Boolean(record?.reviewer && record?.reviewedAt);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {invalid ? (
        <div role="alert" className="flex flex-col gap-2 rounded-card border border-danger/40 bg-white p-4">
          <h2 className="text-compact font-semibold text-danger">
            {result.errors.length === 1
              ? "There is 1 problem with this form"
              : `There are ${result.errors.length} problems with this form`}
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {result.errors.map((error) => (
              <li key={error.field} className="text-caption font-medium text-danger">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result?.ok ? (
        <p role="status" className="rounded-card border border-success/40 bg-white px-4 py-3 text-caption text-slate">
          <strong className="font-semibold text-navy">Validation passed.</strong> Nothing has been
          saved — there is no mutation to save to.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="flex flex-col gap-5 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Article details</legend>

            <AdminTextField
              id="title"
              label="Article title"
              required
              value={title}
              onChange={setTitle}
              error={errorFor(result, "title")}
              maxLength={LIMITS.title}
              placeholder="What cross-border filing obligations actually mean"
            />

            <div className="flex flex-col gap-2">
              <AdminTextField
                id="slug"
                label="URL slug"
                required
                value={slug}
                onChange={setSlug}
                error={errorFor(result, "slug")}
                maxLength={LIMITS.slug}
                placeholder="cross-border-filing-obligations"
              />
              <button
                type="button"
                onClick={() => setSlug(toSlug(title))}
                disabled={!title.trim()}
                className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-action disabled:opacity-40"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden />
                Generate from title
              </button>
            </div>

            <AdminTextArea
              id="excerpt"
              label="Excerpt"
              rows={3}
              value={excerpt}
              onChange={setExcerpt}
              error={errorFor(result, "excerpt")}
              maxLength={LIMITS.excerpt}
              hint="Shown on resource cards and listings."
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Article content</legend>
            <ContentEditor blocks={blocks} onChange={setBlocks} />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Featured image</legend>
            <MediaPicker
              label="Featured image"
              hint="Choose from approved assets. New uploads require the R2 integration."
              value={image}
              onChange={(path) => {
                setImage(path);
                if (!path) setImageAlt("");
              }}
            />
            {image ? (
              <AdminTextField
                id="imageAlt"
                label="Image alt text"
                required
                value={imageAlt}
                onChange={setImageAlt}
                error={errorFor(result, "imageAlt")}
                maxLength={LIMITS.altText}
                hint="Describe what the image shows. Required whenever an image is set — an image without alt text is an accessibility defect, not a style choice."
              />
            ) : null}
          </fieldset>

          <SeoFields
            values={seo}
            onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
            errors={{
              seoTitle: errorFor(result, "seoTitle"),
              seoDescription: errorFor(result, "seoDescription"),
            }}
            fallbackTitle={title || "Article title"}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Classification</legend>

            <AdminSelectField
              id="category"
              label="Category"
              required
              value={category}
              onChange={setCategory}
              error={errorFor(result, "category")}
              options={[
                { value: "", label: "Select a category…" },
                ...articleCategories.map((entry) => ({ value: entry, label: entry })),
              ]}
            />

            <AdminSelectField
              id="jurisdiction"
              label="Tax jurisdiction"
              value={jurisdiction}
              onChange={setJurisdiction}
              options={[
                { value: "", label: "Not jurisdiction-specific" },
                ...jurisdictions,
              ]}
              hint="Set this whenever the article states anything specific to one tax authority, so it is never presented as a universal position."
            />

            <AdminTextField
              id="author"
              label="Author"
              value={author}
              onChange={setAuthor}
              hint="Attribution shown on the published article."
            />
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Editorial review</legend>

            {reviewed ? (
              <p className="text-caption text-slate">
                Reviewed by <span className="font-medium text-navy">{record?.reviewer}</span> on{" "}
                <span className="font-medium text-navy">{record?.reviewedAt?.slice(0, 10)}</span>.
              </p>
            ) : (
              <p className="flex gap-2 rounded-input bg-tint/70 px-3 py-2 text-caption text-slate">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                <span>
                  Not reviewed. Tax content must be reviewed by an authorized professional before
                  publication, and the review is recorded by a reviewer action — not typed in here
                  by the author.
                </span>
              </p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Publication</legend>

            <AdminSelectField
              id="status"
              label="Publication status"
              value={status}
              onChange={(value) => setStatus(value as AdminArticleRow["status"])}
              options={STATUS_OPTIONS}
            />

            {status === "published" && !reviewed ? (
              <p role="alert" className="rounded-input bg-tint/70 px-3 py-2 text-caption text-danger">
                This article has no recorded review. Publishing it would put unreviewed tax content
                in front of readers — the publish path must refuse this on the server.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-input border border-border bg-white px-4 text-compact font-medium text-navy hover:bg-tint"
              >
                Validate form
              </button>

              <button
                type="button"
                disabled
                aria-disabled
                title="Saving requires an authorized Convex mutation, which does not exist yet"
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-1.5 rounded-input bg-action/40 px-4 text-compact font-medium text-white"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save {isNew ? "article" : "changes"}
              </button>

              <Link
                href="/admin/articles"
                className="inline-flex min-h-11 items-center justify-center rounded-input px-4 text-compact font-medium text-slate hover:bg-tint"
              >
                Cancel
              </Link>
            </div>
          </fieldset>

          {record ? (
            <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
              <h2 className="text-compact font-semibold text-navy">Danger zone</h2>
              <DeleteConfirmation
                recordName={record.title}
                recordType="article"
                consequence="Archiving is usually preferable to deletion — it keeps the record and its review history."
              />
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
