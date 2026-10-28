import type { Metadata } from "next";
import Image from "next/image";
import { AlertTriangle, ImageIcon, Upload } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { demoMedia } from "@/lib/admin/admin-fixtures";
import { formatFileSize } from "@/lib/admin/admin-formatters";
import {
  buildAdminList,
  readPage,
  readParam,
  resultSummary,
  type AdminSearchParams,
} from "@/lib/admin/admin-list";
import type { AdminMediaAsset } from "@/lib/admin/admin-types";

export const metadata: Metadata = { title: "Media Library" };

/**
 * Media library.
 *
 * Every asset listed is a file that already ships in `public/` and is
 * already served publicly. There is no private media here and no object key,
 * signed URL or credential of any kind — the R2 integration does not exist.
 *
 * The upload panel is presented as a specification of what secure upload
 * will require, with the control disabled. A working file input would either
 * do nothing or imply that a file had been stored, and the brief is explicit
 * that uploads must not be simulated (section 12).
 */
export default async function AdminMediaScreen({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const query = readParam(params, "q");
  const type = readParam(params, "type") || "all";

  const list = buildAdminList<AdminMediaAsset>({
    rows: demoMedia,
    query,
    searchFields: (row) => [row.objectKey, row.path, row.altText ?? "", row.contentType],
    filterValue: type,
    filterMatch: (row, value) =>
      value === "missing-alt" ? !row.altText : row.contentType === value,
    sort: (a, b) => a.objectKey.localeCompare(b.objectKey),
    page: readPage(params),
    pageSize: 12,
  });

  const missingAlt = demoMedia.filter((asset) => !asset.altText).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Media Library"
        description="Approved public website assets. Private document storage is deliberately not part of this interface."
        actions={
          <button
            type="button"
            disabled
            aria-disabled
            title="Secure upload requires the R2 presigned-upload flow, which does not exist yet"
            className="inline-flex min-h-11 cursor-not-allowed items-center gap-1.5 rounded-input bg-action/40 px-4 text-compact font-medium text-white"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload asset
          </button>
        }
      />

      <ProvenanceNotice
        provenance="demonstration"
        entity="media records"
        detail="Each row points at a file already shipped in public/ and listed in ATTRIBUTIONS.md, so nothing here is a private or unapproved asset."
      />

      <section
        aria-labelledby="upload-requirements"
        className="flex gap-3 rounded-card border border-warning/40 bg-white p-5"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div className="flex min-w-0 flex-col gap-2">
          <h2 id="upload-requirements" className="text-compact font-semibold text-navy">
            Why upload is disabled
          </h2>
          <p className="max-w-[92ch] text-caption text-slate">
            Uploading is not a form control problem, it is a protocol. API.md section 5 requires
            the browser to request an upload intent, the server to verify the actor, purpose,
            bucket and size limits, a short-lived purpose-scoped URL to be issued, the bytes to go
            directly to R2, and the server to verify the stored object before the record is marked
            complete. None of that exists, and there is no authentication to identify the actor in
            the first place.
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-caption text-slate">
            <li>No R2 credential or bucket name appears in this interface or its bundle.</li>
            <li>No public link is ever generated for a private object.</li>
            <li>
              Private tax documents and credential evidence are out of scope for the CMS entirely —
              they belong to a separate, access-controlled flow.
            </li>
          </ul>
        </div>
      </section>

      <AdminFilterBar
        action="/admin/media"
        query={query}
        searchLabel="Search media by file name or alt text"
        searchPlaceholder="Search media by file name, path or alt text"
        filterName="type"
        filterLabel="Filter"
        filterOptions={[
          { value: "all", label: "All", count: demoMedia.length },
          {
            value: "image/jpeg",
            label: "JPEG",
            count: demoMedia.filter((asset) => asset.contentType === "image/jpeg").length,
          },
          {
            value: "image/svg+xml",
            label: "SVG",
            count: demoMedia.filter((asset) => asset.contentType === "image/svg+xml").length,
          },
          { value: "missing-alt", label: "Missing alt text", count: missingAlt },
        ]}
        activeFilter={type}
        resultSummary={resultSummary(list.matched, list.total, "asset")}
      />

      {list.rows.length === 0 ? (
        <AdminEmptyState
          icon={ImageIcon}
          title="No assets match these filters"
          description="Clear the filters to see every approved asset."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.rows.map((asset) => (
            <li
              key={asset.id}
              className="flex flex-col overflow-hidden rounded-card border border-border bg-white"
            >
              <div className="relative aspect-[4/3] w-full bg-tint">
                <Image
                  src={asset.path}
                  alt={asset.altText ?? ""}
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="min-w-0 truncate text-caption font-medium text-navy" title={asset.path}>
                  {asset.path.split("/").pop()}
                </p>

                <dl className="flex flex-col gap-1 text-caption text-slate">
                  <div className="flex justify-between gap-2">
                    <dt>Type</dt>
                    <dd className="font-mono">{asset.contentType}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Size</dt>
                    <dd className="tabular-nums">{formatFileSize(asset.sizeBytes)}</dd>
                  </div>
                </dl>

                {asset.altText ? (
                  <p className="text-caption text-slate">
                    <span className="font-medium text-navy">Alt:</span> {asset.altText}
                  </p>
                ) : (
                  <p className="text-caption font-medium text-warning">
                    No alt text recorded — this asset should not be used until it has one.
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  <AdminStatusBadge
                    status={asset.approvalStatus === "approved" ? "published" : "draft"}
                    label={asset.approvalStatus === "approved" ? "Approved" : "Not approved"}
                    tone={asset.approvalStatus === "approved" ? "success" : "neutral"}
                  />
                  <AdminStatusBadge
                    status={asset.visibility === "public" ? "published" : "draft"}
                    label={asset.visibility === "public" ? "Public" : "Private"}
                    tone={asset.visibility === "public" ? "info" : "neutral"}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReadOnlyNotice />
    </div>
  );
}
