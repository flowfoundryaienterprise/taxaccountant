import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { ServiceEditorForm } from "@/components/admin/service-editor-form";
import { adminServices } from "@/lib/admin/admin-data";

interface EditServiceProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditServiceProps): Promise<Metadata> {
  const { id } = await params;
  const record = adminServices().find((service) => service.id === id);
  return { title: record ? `Edit ${record.name}` : "Service not found" };
}

export default async function EditServiceScreen({ params }: EditServiceProps) {
  const { id } = await params;
  const services = adminServices();
  const record = services.find((service) => service.id === id);

  if (!record) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={`Edit: ${record.name}`}
        description="This category is live on the public site. Changes here are not saved."
        actions={<AdminStatusBadge status={record.status} />}
      />
      <ProvenanceNotice provenance={record.provenance} entity="service categories" />
      <ReadOnlyNotice />
      <ServiceEditorForm record={record} existingSlugs={services.map((service) => service.slug)} />
    </div>
  );
}
