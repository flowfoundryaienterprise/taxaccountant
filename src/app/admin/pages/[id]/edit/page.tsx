import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { PageEditorForm } from "@/components/admin/page-editor-form";
import { demoPages } from "@/lib/admin/admin-fixtures";
import { formatDate } from "@/lib/admin/admin-formatters";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  const record = demoPages.find((page) => page.id === id);
  return { title: record ? `Edit ${record.title}` : "Page not found" };
}

export default async function EditPageScreen({ params }: EditPageProps) {
  const { id } = await params;
  const record = demoPages.find((page) => page.id === id);

  // An unknown id is a 404 here just as it would be once this reads a real
  // query — the screen never invents an empty record to edit.
  if (!record) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit: ${record.title}`}
        description={`Last updated ${formatDate(record.updatedAt) ?? "—"}. Locale ${record.locale}.`}
        actions={<AdminStatusBadge status={record.status} />}
      />
      <ProvenanceNotice provenance={record.provenance} entity="pages" />
      <ReadOnlyNotice />
      <PageEditorForm record={record} existingSlugs={demoPages.map((page) => page.slug)} />
    </div>
  );
}
