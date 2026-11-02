import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PageEditorForm } from "@/components/admin/page-editor-form";
import { contentRepository } from "@/lib/cms/content-adapter";

export const metadata: Metadata = { title: "New page" };

export default async function NewPageScreen() {
  const { items } = await contentRepository.listPages({ q: "" });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Create page"
        description="Draft a new website page, guide or glossary entry."
      />
      <PageEditorForm existingSlugs={items.map((page) => page.slug)} />
    </div>
  );
}
