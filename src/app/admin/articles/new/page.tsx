import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReadOnlyNotice } from "@/components/admin/admin-notices";
import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { adminJurisdictions } from "@/lib/admin/admin-data";
import { demoArticles } from "@/lib/admin/admin-fixtures";

export const metadata: Metadata = { title: "New article" };

export default function NewArticleScreen() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Create article"
        description="Draft an article or resource. Tax content needs a recorded editorial review before it can be published."
      />
      <ReadOnlyNotice />
      <ArticleEditorForm
        existingSlugs={demoArticles.map((article) => article.slug)}
        jurisdictions={adminJurisdictions().map((row) => ({ value: row.code, label: row.label }))}
      />
    </div>
  );
}
