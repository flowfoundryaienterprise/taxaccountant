import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { PageEditorForm } from "@/components/admin/page-editor-form";
import { formatDate } from "@/lib/admin/admin-formatters";
import { contentRepository, toAdminPageRow } from "@/lib/cms/content-adapter";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  const record = await contentRepository.getPage(id);
  return { title: record ? `Edit ${record.title}` : "Page not found" };
}

export default async function EditPageScreen({ params }: EditPageProps) {
  const { id } = await params;
  const [cmsPage, { items }] = await Promise.all([
    contentRepository.getPage(id),
    contentRepository.listPages({ q: "" }),
  ]);

  // An unknown id is a 404 here, same as it would be for any other missing
  // record — the screen never invents an empty one to edit.
  if (!cmsPage) notFound();
  const record = toAdminPageRow(cmsPage);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit: ${record.title}`}
        description={`Last updated ${formatDate(record.updatedAt) ?? "—"}. Locale ${record.locale}.`}
        actions={<AdminStatusBadge status={record.status} />}
      />
      <PageEditorForm
        record={record}
        existingSlugs={items.map((page) => page.slug)}
      />
    </div>
  );
}
