import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { adminJurisdictions } from "@/lib/admin/admin-data";
import { formatDate } from "@/lib/admin/admin-formatters";
import { contentRepository, toAdminArticleRow } from "@/lib/cms/content-adapter";

interface EditArticleProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditArticleProps): Promise<Metadata> {
  const { id } = await params;
  const record = await contentRepository.getArticle(id);
  return { title: record ? `Edit ${record.title}` : "Article not found" };
}

export default async function EditArticleScreen({ params }: EditArticleProps) {
  const { id } = await params;
  const [cmsArticle, { items }] = await Promise.all([
    contentRepository.getArticle(id),
    contentRepository.listArticles({ q: "" }),
  ]);

  if (!cmsArticle) notFound();
  const record = toAdminArticleRow(cmsArticle);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit: ${record.title}`}
        description={`${record.category} · last updated ${formatDate(record.updatedAt) ?? "—"}`}
        actions={<AdminStatusBadge status={record.status} />}
      />
      <ArticleEditorForm
        record={record}
        existingSlugs={items.map((article) => article.slug)}
        jurisdictions={adminJurisdictions().map((row) => ({ value: row.code, label: row.label }))}
      />
    </div>
  );
}
