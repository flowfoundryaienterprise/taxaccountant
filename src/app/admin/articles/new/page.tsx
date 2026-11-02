import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { adminJurisdictions } from "@/lib/admin/admin-data";
import { contentRepository } from "@/lib/cms/content-adapter";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticleScreen() {
  const { items } = await contentRepository.listArticles({ q: "" });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Create article"
        description="Draft an article or resource. Tax content needs a recorded editorial review before it can be published."
      />
      <ArticleEditorForm
        existingSlugs={items.map((article) => article.slug)}
        jurisdictions={adminJurisdictions().map((row) => ({ value: row.code, label: row.label }))}
      />
    </div>
  );
}
