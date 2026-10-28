import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReadOnlyNotice } from "@/components/admin/admin-notices";
import { PageEditorForm } from "@/components/admin/page-editor-form";
import { demoPages } from "@/lib/admin/admin-fixtures";

export const metadata: Metadata = { title: "New page" };

export default function NewPageScreen() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Create page"
        description="Draft a new website page, guide or glossary entry. Validation runs; saving does not."
      />
      <ReadOnlyNotice />
      <PageEditorForm existingSlugs={demoPages.map((page) => page.slug)} />
    </div>
  );
}
