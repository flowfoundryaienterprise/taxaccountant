"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { CheckCircle2, Loader2, ShieldAlert, Wand2 } from "lucide-react";

import {
  AdminSelectField,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-form-field";
import { ContentEditor } from "@/components/admin/content-editor";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";
import { MediaPicker } from "@/components/admin/media-picker";
import { ContentPreview } from "@/components/admin/content-preview";
import { ContentValidationSummary } from "@/components/admin/content-validation-summary";
import { EditorialActionBar } from "@/components/admin/editorial-action-bar";
import { SeoFields } from "@/components/admin/seo-fields";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { articleCategories } from "@/lib/admin/admin-fixtures";
import { toSlug } from "@/lib/admin/admin-formatters";
import { LIMITS, errorFor, validateArticleForm } from "@/lib/admin/admin-validation";
import type { EditorialAction, EditorialStatus } from "@/lib/cms/content-status";
import { articlePublishIssues, toActionBlockers } from "@/lib/cms/content-validation";
import type { AdminArticleRow, ContentBlock } from "@/lib/admin/admin-types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ArticleEditorFormProps {
  record?: AdminArticleRow;
  existingSlugs: string[];
  /** Jurisdiction options, so a jurisdiction-specific article can be scoped. */
  jurisdictions: { value: string; label: string }[];
}


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
  const router = useRouter();
  const saveDraft = useMutation(api.content.saveDraft);
  const requestReview = useMutation(api.content.requestReview);
  const returnToDraft = useMutation(api.content.returnToDraft);
  const recordReview = useMutation(api.content.recordReview);
  const publishMutation = useMutation(api.content.publish);
  const unpublish = useMutation(api.content.unpublish);
  const archive = useMutation(api.content.archive);
  const deleteContent = useMutation(api.content.deleteContent);

  const [title, setTitle] = React.useState(record?.title ?? "");
  const [slug, setSlug] = React.useState(record?.slug ?? "");
  const [excerpt, setExcerpt] = React.useState(record?.excerpt ?? "");
  const [category, setCategory] = React.useState(record?.category ?? "");
  const [jurisdiction, setJurisdiction] = React.useState(record?.jurisdictionCode ?? "");
  const [blocks, setBlocks] = React.useState<ContentBlock[]>(record?.body ?? []);
  const [image, setImage] = React.useState<string | undefined>(record?.featuredImage?.path);
  const [imageAlt, setImageAlt] = React.useState(record?.featuredImage?.alt ?? "");
  const [seo, setSeo] = React.useState({
    seoTitle: record?.seo.title ?? "",
    seoDescription: record?.seo.description ?? "",
    canonicalPath: record?.seo.canonicalPath ?? "",
  });

  const [result, setResult] = React.useState<ReturnType<typeof validateArticleForm>>();
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [markingReviewed, setMarkingReviewed] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  const otherSlugs = React.useMemo(
    () => existingSlugs.filter((entry) => entry !== record?.slug),
    [existingSlugs, record?.slug],
  );

  async function performSave() {
    const validation = validateArticleForm(
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
    );
    setResult(validation);
    if (!validation.ok) throw new Error("Fix the highlighted fields before saving.");

    const { id } = await saveDraft({
      id: record?.id as Id<"contentPages"> | undefined,
      kind: "blog",
      title,
      slug,
      summary: excerpt || undefined,
      body: blocks,
      seo: {
        title: seo.seoTitle || undefined,
        description: seo.seoDescription || undefined,
        canonicalPath: seo.canonicalPath || undefined,
      },
      category: category || undefined,
      featuredImage: image ? { path: image, alt: imageAlt } : undefined,
    });
    setSavedAt(Date.now());
    if (!record) {
      router.push(`/admin/articles/${id}/edit`);
    } else {
      router.refresh();
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await performSave();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function onWorkflowAction(action: EditorialAction) {
    if (!record) throw new Error("Save this article as a draft first.");
    const id = record.id as Id<"contentPages">;
    switch (action) {
      case "saveDraft":
        await performSave();
        return;
      case "submitForReview":
        await requestReview({ id });
        break;
      case "returnToDraft":
        await returnToDraft({ id });
        break;
      case "publish":
        await publishMutation({ id });
        break;
      case "unpublish":
        await unpublish({ id });
        break;
      case "archive":
        await archive({ id });
        break;
    }
    router.refresh();
  }

  async function onMarkReviewed() {
    if (!record) return;
    setMarkingReviewed(true);
    setReviewError(null);
    try {
      await recordReview({ id: record.id as Id<"contentPages"> });
      router.refresh();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setMarkingReviewed(false);
    }
  }

  const invalid = result && !result.ok;
  const reviewed = Boolean(record?.reviewer && record?.reviewedAt);
  const canMarkReviewed = record?.status === "review" && !reviewed;

  /*
   * Publish-readiness is recomputed from the *live form state*, not from the
   * saved record, so an editor sees the effect of what they are typing. The
   * review fields are the exception — they come from the record, because a
   * review is something a reviewer performs, not something an author can
   * type into this form.
   */
  const publishIssues = React.useMemo(
    () =>
      articlePublishIssues({
        title,
        slug,
        body: blocks,
        category,
        seo: { description: seo.seoDescription },
        featuredImage: image ? { path: image, alt: imageAlt } : undefined,
        editorial: { reviewer: record?.reviewer, reviewedAt: record?.reviewedAt },
      }),
    [title, slug, blocks, category, seo.seoDescription, image, imageAlt, record],
  );

  const dirty =
    title !== (record?.title ?? "") ||
    slug !== (record?.slug ?? "") ||
    excerpt !== (record?.excerpt ?? "") ||
    category !== (record?.category ?? "") ||
    jurisdiction !== (record?.jurisdictionCode ?? "") ||
    image !== record?.featuredImage?.path ||
    imageAlt !== (record?.featuredImage?.alt ?? "") ||
    JSON.stringify(blocks) !== JSON.stringify(record?.body ?? []);

  const jurisdictionText = jurisdictions.find((entry) => entry.value === jurisdiction)?.label;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {invalid ? (
        <div role="alert" className="flex flex-col gap-2 rounded-card border border-danger/40 bg-white p-4">
          <h2 className="text-compact font-medium text-danger">
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

      {saveError ? (
        <p role="alert" className="rounded-card border border-danger/40 bg-white px-4 py-3 text-caption font-medium text-danger">
          {saveError}
        </p>
      ) : null}

      {savedAt && result?.ok ? (
        <p role="status" className="rounded-card border border-success/40 bg-white px-4 py-3 text-caption text-slate">
          <strong className="font-semibold text-navy">Saved.</strong> This draft is stored in Convex.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="flex flex-col gap-5 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Article details</legend>

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
                className="inline-flex w-fit items-center gap-1.5 text-caption font-medium text-action disabled:opacity-40"
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

          <fieldset className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Article content</legend>
            <ContentEditor blocks={blocks} onChange={setBlocks} />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Featured image</legend>
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

          <ContentValidationSummary issues={publishIssues} subject="article" />

          {/* Renders the live form state through the same block renderer the
              public resource pages use, inside the editor — there is no
              preview URL and no draft is reachable from outside. */}
          <ContentPreview
            status={(record?.status ?? "draft") as EditorialStatus}
            title={title}
            excerpt={excerpt}
            body={blocks}
            category={category}
            jurisdictionLabel={jurisdictionText}
            featuredImage={image ? { path: image, alt: imageAlt } : undefined}
            author={record?.author}
            reviewer={record?.reviewer}
            reviewedAt={record?.reviewedAt}
            publishedAt={record?.publishedAt}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <fieldset className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Classification</legend>

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

            <p className="text-caption text-slate">
              Author:{" "}
              <span className="font-medium text-navy">{record?.author ?? "Set automatically when you save a new article"}</span>
            </p>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Editorial review</legend>

            {reviewed ? (
              <p className="text-caption text-slate">
                Reviewed by <span className="font-medium text-navy">{record?.reviewer}</span> on{" "}
                <span className="font-medium text-navy">{record?.reviewedAt?.slice(0, 10)}</span>.
              </p>
            ) : (
              <p className="flex gap-2 rounded-input bg-subtle px-3 py-2 text-caption text-slate">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                <span>
                  Not reviewed. Tax content must be reviewed by an authorized professional before
                  publication, and the review is recorded by a reviewer action — not typed in here
                  by the author.
                </span>
              </p>
            )}

            {canMarkReviewed ? (
              <>
                {reviewError ? (
                  <p role="alert" className="text-caption font-medium text-danger">
                    {reviewError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={onMarkReviewed}
                  disabled={markingReviewed}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-subtle disabled:opacity-60"
                >
                  {markingReviewed ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                  )}
                  Mark reviewed
                </button>
              </>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5">
            <legend className="px-1 text-compact font-medium text-navy">Publication</legend>

            <p className="text-caption text-slate">
              Status: <span className="font-medium text-navy">{record?.status ?? "Not saved yet"}</span>.
              Changed only through the workflow actions below, not this form.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-subtle disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {record ? "Save draft" : "Create article"}
            </button>
          </fieldset>

          <EditorialActionBar
            status={record?.status ?? "draft"}
            backendReady={Boolean(record)}
            blockers={toActionBlockers(publishIssues)}
            onAction={onWorkflowAction}
          >
            <UnsavedChangesDialog dirty={dirty} cancelHref="/admin/articles" />
          </EditorialActionBar>

          {record ? (
            <div className="flex flex-col gap-2 rounded-[1.25rem] border border-border bg-white p-5">
              <h2 className="text-compact font-medium text-navy">Danger zone</h2>
              <DeleteConfirmation
                recordName={record.title}
                recordType="article"
                consequence="Archiving is usually preferable to deletion — it keeps the record and its review history."
                onConfirm={async () => {
                  await deleteContent({ id: record.id as Id<"contentPages"> });
                  router.push("/admin/articles");
                }}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
