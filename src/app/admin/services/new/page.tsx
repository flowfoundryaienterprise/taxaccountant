import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReadOnlyNotice } from "@/components/admin/admin-notices";
import { ServiceEditorForm } from "@/components/admin/service-editor-form";
import { adminServices } from "@/lib/admin/admin-data";

export const metadata: Metadata = { title: "New service" };

export default function NewServiceScreen() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Add service category"
        description="A new category appears in the service grid, the nav menus and the directory's service filter once published."
      />
      <ReadOnlyNotice />
      <ServiceEditorForm existingSlugs={adminServices().map((service) => service.slug)} />
    </div>
  );
}
