"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";

import {
  AdminSelectField,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-form-field";
import { ContentEditor } from "@/components/admin/content-editor";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";
import { ContentPreview } from "@/components/admin/content-preview";
import { ContentValidationSummary } from "@/components/admin/content-validation-summary";
import { EditorialActionBar } from "@/components/admin/editorial-action-bar";
import { SeoFields } from "@/components/admin/seo-fields";
import { UnsavedChangesDialog } from "@/components/admin/unsaved-changes-dialog";
import { toSlug } from "@/lib/admin/admin-formatters";
import { LIMITS, errorFor, validatePageForm } from "@/lib/admin/admin-validation";
import type { EditorialStatus } from "@/lib/cms/content-status";
import { pagePublishIssues, toActionBlockers } from "@/lib/cms/content-validation";
import type { AdminPageRow, ContentBlock } from "@/lib/admin/admin-types";

interface PageEditorFormProps {
  /** Omitted when creating. */
  record?: AdminPageRow;
  /** Slugs already in use, for the advisory uniqueness check. */
  existingSlugs: string[];
}

const KIND_OPTIONS = [
  { value: "page", label: "Page" },
  { value: "guide", label: "Guide" },
  { value: "glossary", label: "Glossary entry" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

/**
 * Create / edit form for a content page.
 *
 * ## Validation runs; saving does not
 * The form validates on submit and renders inline, accessible errors, so the
 * rules can be reviewed and agreed before the backend exists. The submit
 * button is permanently disabled: there is no authorized mutation and no
 * authentication to authorize one, and a button that appears to save but
 * discards the input would be worse than no button
 * (brief section 18: "Do not implement fake successful saves").
 *
 * The unsaved-change indicator is real — it compares current values against
 * the loaded record — because it is the thing that will matter most once
 * saving works, and it costs nothing to get right now.
 */
export function PageEditorForm({ record, existingSlugs }: PageEditorFormProps) {
  const [title, setTitle] = React.useState(record?.title ?? "");
  const [slug, setSlug] = React.useState(record?.slug ?? "");
  const [kind, setKind] = React.useState(record?.kind ?? "page");
  const [status, setStatus] = React.useState(record?.status ?? "draft");
  const [summary, setSummary] = React.useState(record?.summary ?? "");
  const [blocks, setBlocks] = React.useState<ContentBlock[]>(record?.body ?? []);
  const [seo, setSeo] = React.useState({
    seoTitle: record?.seo.title ?? "",
    seoDescription: record?.seo.description ?? "",
    canonicalPath: record?.seo.canonicalPath ?? "",
  });

  const [result, setResult] = React.useState<ReturnType<typeof validatePageForm>>();

  // The slug a record already owns must not count against itself.
  const otherSlugs = React.useMemo(
    () => existingSlugs.filter((entry) => entry !== record?.slug),
    [existingSlugs, record?.slug],
  );

  const dirty =
    title !== (record?.title ?? "") ||
    slug !== (record?.slug ?? "") ||
    kind !== (record?.kind ?? "page") ||
    status !== (record?.status ?? "draft") ||
    summary !== (record?.summary ?? "") ||
    JSON.stringify(blocks) !== JSON.stringify(record?.body ?? []) ||
    seo.seoTitle !== (record?.seo.title ?? "") ||
    seo.seoDescription !== (record?.seo.description ?? "") ||
    seo.canonicalPath !== (record?.seo.canonicalPath ?? "");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(validatePageForm({ title, slug, summary, ...seo }, otherSlugs));
  };

  const publishIssues = React.useMemo(
    () =>
      pagePublishIssues({
        title,
        slug,
        body: blocks,
        seo: { description: seo.seoDescription },
      }),
    [title, slug, blocks, seo.seoDescription],
  );

  const invalid = result && !result.ok;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {invalid ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-card border border-danger/40 bg-white p-4"
        >
          <h2 className="text-compact font-semibold text-danger">
            {result.errors.length === 1
              ? "There is 1 problem with this form"
              : `There are ${result.errors.length} problems with this form`}
          </h2>
          {/* An error summary that links to each field — the pattern
              DESIGN.md section 10 asks for on longer forms. */}
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {result.errors.map((error) => (
              <li key={error.field}>
                <a
                  href={`#${error.field === "seoTitle" ? "seo-title" : error.field === "seoDescription" ? "seo-description" : error.field}`}
                  className="text-caption font-medium text-danger underline"
                >
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result?.ok ? (
        <p
          role="status"
          className="rounded-card border border-success/40 bg-white px-4 py-3 text-caption text-slate"
        >
          <strong className="font-semibold text-navy">Validation passed.</strong> These values
          would be accepted by the rules defined so far. Nothing has been saved — there is no
          mutation to save to.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className="flex flex-col gap-5 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Page details</legend>

            <AdminTextField
              id="title"
              label="Page title"
              required
              value={title}
              onChange={setTitle}
              error={errorFor(result, "title")}
              maxLength={LIMITS.title}
              placeholder="About TaxAccountant.com"
              hint="Shown as the page heading and used as the SEO title fallback."
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
                placeholder="about"
                hint="Lowercase letters, numbers and single hyphens. Changing a published slug breaks existing links unless a redirect is added."
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
              id="summary"
              label="Page summary"
              rows={3}
              value={summary}
              onChange={setSummary}
              error={errorFor(result, "summary")}
              maxLength={LIMITS.summary}
              hint="A short description used in listings. Not the meta description, though it may be similar."
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Page content</legend>
            <p className="text-caption text-slate">
              Structured blocks of plain text. No HTML is stored or rendered, so CMS content
              cannot carry markup or script into a public page.
            </p>
            <ContentEditor blocks={blocks} onChange={setBlocks} />
          </fieldset>

          <SeoFields
            values={seo}
            onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
            errors={{
              seoTitle: errorFor(result, "seoTitle"),
              seoDescription: errorFor(result, "seoDescription"),
            }}
            fallbackTitle={title || "Page title"}
          />

          <ContentValidationSummary issues={publishIssues} subject="page" />

          {/* Editor-local preview of the live form state. No preview URL
              exists, so no draft is reachable from outside this screen. */}
          <ContentPreview
            status={status as EditorialStatus}
            title={title}
            excerpt={summary}
            body={blocks}
            // A standalone page is not tax guidance, so it carries no
            // tax-content disclaimer of its own.
            showDisclaimer={false}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Publication</legend>

            <AdminSelectField
              id="kind"
              label="Content type"
              value={kind}
              onChange={(value) => setKind(value as AdminPageRow["kind"])}
              options={KIND_OPTIONS}
            />

            <AdminSelectField
              id="status"
              label="Publication status"
              value={status}
              onChange={(value) => setStatus(value as AdminPageRow["status"])}
              options={STATUS_OPTIONS}
              hint="Only published content is eligible to appear publicly, and the public query must enforce that on the server."
            />

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-tint"
            >
              Check fields
            </button>
          </fieldset>

          <EditorialActionBar
            status={status as EditorialStatus}
            blockers={toActionBlockers(publishIssues)}
          >
            <UnsavedChangesDialog dirty={dirty} cancelHref="/admin/pages" />
          </EditorialActionBar>

          {record ? (
            <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
              <h2 className="text-compact font-semibold text-navy">Danger zone</h2>
              <p className="text-caption text-slate">
                Deleting a published page breaks any link pointing at it.
              </p>
              <DeleteConfirmation
                recordName={record.title}
                recordType="page"
                consequence="Any inbound link to this path would start returning a not-found page."
              />
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
