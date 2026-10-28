import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { adminJurisdictions } from "@/lib/admin/admin-data";
import { demoArticles } from "@/lib/admin/admin-fixtures";
import { formatDate } from "@/lib/admin/admin-formatters";

interface EditArticleProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditArticleProps): Promise<Metadata> {
  const { id } = await params;
  const record = demoArticles.find((article) => article.id === id);
  return { title: record ? `Edit ${record.title}` : "Article not found" };
}

export default async function EditArticleScreen({ params }: EditArticleProps) {
  const { id } = await params;
  const record = demoArticles.find((article) => article.id === id);

  if (!record) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit: ${record.title}`}
        description={`${record.category} · last updated ${formatDate(record.updatedAt) ?? "—"}`}
        actions={<AdminStatusBadge status={record.status} />}
      />
      <ProvenanceNotice provenance={record.provenance} entity="articles" />
      <ReadOnlyNotice />
      <ArticleEditorForm
        record={record}
        existingSlugs={demoArticles.map((article) => article.slug)}
        jurisdictions={adminJurisdictions().map((row) => ({ value: row.code, label: row.label }))}
      />
    </div>
  );
}
