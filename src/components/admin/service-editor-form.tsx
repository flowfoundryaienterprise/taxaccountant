"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Save } from "lucide-react";

import {
  AdminSelectField,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-form-field";
import { DeleteConfirmation } from "@/components/admin/delete-confirmation";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoFields } from "@/components/admin/seo-fields";
import { LIMITS, errorFor, validatePageForm } from "@/lib/admin/admin-validation";
import type { AdminServiceRow } from "@/lib/admin/admin-types";

interface ServiceEditorFormProps {
  record?: AdminServiceRow;
  existingSlugs: string[];
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

/**
 * Create / edit form for a service category.
 *
 * ## The slug is locked on an existing record
 * A service slug is a public contract: `/services/[slug]`, the directory's
 * `?service=` parameter, every saved filter link and the professional
 * service mappings all key off it. Editing one in place would break all of
 * them silently, so on an existing record the field is read-only and says
 * why. A new service can choose its slug freely.
 *
 * As everywhere in this CMS, validation runs and saving does not.
 */
export function ServiceEditorForm({ record, existingSlugs }: ServiceEditorFormProps) {
  const isNew = !record;

  const [name, setName] = React.useState(record?.name ?? "");
  const [slug, setSlug] = React.useState(record?.slug ?? "");
  const [summary, setSummary] = React.useState(record?.summary ?? "");
  const [iconRef, setIconRef] = React.useState(record?.iconRef ?? "");
  const [image, setImage] = React.useState<string | undefined>(record?.featuredImagePath);
  const [sortOrder, setSortOrder] = React.useState(String(record?.sortOrder ?? ""));
  const [status, setStatus] = React.useState(record?.status ?? "draft");
  const [seo, setSeo] = React.useState({
    seoTitle: record?.seo.title ?? "",
    seoDescription: record?.seo.description ?? "",
    canonicalPath: record?.seo.canonicalPath ?? "",
  });

  const [result, setResult] = React.useState<ReturnType<typeof validatePageForm>>();

  const otherSlugs = React.useMemo(
    () => existingSlugs.filter((entry) => entry !== record?.slug),
    [existingSlugs, record?.slug],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(validatePageForm({ title: name, slug, summary, ...seo }, otherSlugs));
  };

  const invalid = result && !result.ok;

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
            <legend className="px-1 text-compact font-semibold text-navy">Service details</legend>

            <AdminTextField
              id="title"
              label="Service name"
              required
              value={name}
              onChange={setName}
              error={errorFor(result, "title")}
              maxLength={LIMITS.title}
              placeholder="International Tax Services"
            />

            {isNew ? (
              <AdminTextField
                id="slug"
                label="URL slug"
                required
                value={slug}
                onChange={setSlug}
                error={errorFor(result, "slug")}
                maxLength={LIMITS.slug}
                placeholder="international-tax-services"
                hint="Becomes /services/<slug> and the ?service= filter value. It cannot be changed once the category is published."
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-compact font-medium text-navy">URL slug</span>
                <div className="flex items-center gap-2 rounded-input border border-border bg-tint/50 px-3 py-2.5">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
                  <code className="min-w-0 truncate font-mono text-compact text-slate">
                    /services/{slug}
                  </code>
                </div>
                <p className="text-caption text-slate">
                  Locked. This slug is referenced by the public route, the directory&rsquo;s
                  <code className="mx-1 font-mono">?service=</code>
                  filter and the professional service mappings. Renaming it needs a migration and a
                  redirect, not an inline edit.
                </p>
              </div>
            )}

            <AdminTextArea
              id="summary"
              label="Description"
              rows={3}
              required
              value={summary}
              onChange={setSummary}
              error={errorFor(result, "summary")}
              maxLength={LIMITS.summary}
              hint="The short description used on service cards across the public site."
            />

            <AdminTextField
              id="iconRef"
              label="Icon reference"
              value={iconRef}
              onChange={setIconRef}
              placeholder="Globe2"
              hint="Name of the Lucide icon rendered on service cards."
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Featured image</legend>
            <MediaPicker
              label="Service detail hero image"
              hint="Choose from assets already approved and shipped with the site. Uploading new media requires the R2 integration."
              value={image}
              onChange={setImage}
            />
          </fieldset>

          <SeoFields
            values={seo}
            onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
            errors={{
              seoTitle: errorFor(result, "seoTitle"),
              seoDescription: errorFor(result, "seoDescription"),
            }}
            fallbackTitle={name || "Service name"}
          />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
            <legend className="px-1 text-compact font-semibold text-navy">Publication</legend>

            <AdminTextField
              id="sortOrder"
              label="Display order"
              value={sortOrder}
              onChange={setSortOrder}
              placeholder="1"
              hint="Lower numbers appear first in the service grid and menus."
            />

            <AdminSelectField
              id="status"
              label="Publication status"
              value={status}
              onChange={(value) => setStatus(value as AdminServiceRow["status"])}
              options={STATUS_OPTIONS}
              hint="Archiving a category removes it from discovery but keeps existing links resolvable."
            />

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-tint"
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
                Save {isNew ? "service" : "changes"}
              </button>

              <Link
                href="/admin/services"
                className="inline-flex min-h-11 items-center justify-center rounded-input px-4 text-compact font-medium text-slate hover:bg-tint"
              >
                Cancel
              </Link>
            </div>
          </fieldset>

          {record ? (
            <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
              <h2 className="text-compact font-semibold text-navy">Danger zone</h2>
              <p className="text-caption text-slate">
                Professionals are mapped to this category, and removing it would orphan those
                mappings as well as break the public route.
              </p>
              <DeleteConfirmation
                recordName={record.name}
                recordType="service category"
                consequence="Professional service mappings referencing it would be left dangling."
              />
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
