import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice } from "@/components/admin/admin-notices";
import { fetchAuthQuery } from "@/lib/auth/server";
import { countryName, jurisdictionName, languageName, serviceName } from "@/lib/admin/admin-data";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const record = await fetchAuthQuery(api.adminData.getProfessional, { slug: id });
  return { title: record?.displayName ?? "Listing not found" };
}

export default async function AdminProfessionalDetailScreen({ params }: Props) {
  const { id } = await params;
  const record = await fetchAuthQuery(api.adminData.getProfessional, { slug: id });
  if (!record) notFound();
  const published = record.status === "published" && record.approvedProfile;
  return <div className="flex flex-col gap-6">
    <AdminPageHeader title={record.firmName ?? record.displayName}
      description={`${record.kind === "firm" ? "Firm practice" : "Individual professional"} · slug ${record.slug}`}
      actions={<div className="flex items-center gap-3"><AdminStatusBadge status={record.status} />
        {published ? <Link href={`/professionals/${record.slug}`} className="inline-flex min-h-11 items-center gap-1 rounded-input border border-border bg-white px-4 text-compact font-medium text-navy hover:bg-subtle">View public profile <ExternalLink className="h-4 w-4" /></Link> : null}
      </div>} />
    <ProvenanceNotice provenance="approved" entity="professional listing records" detail="This record is read from Convex through the staff authorization check." />
    {!published ? <p className="rounded-card border border-warning/40 bg-white p-4 text-caption text-slate">This listing is not publicly visible. Its public profile URL returns not found until it is approved and published.</p> : null}
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-white p-5"><h2 className="mb-3 text-compact font-semibold text-navy">Profile</h2>
        <dl className="space-y-3 text-caption"><div><dt className="text-slate">Display name</dt><dd className="font-medium text-navy">{record.displayName}</dd></div>
          <div><dt className="text-slate">Location</dt><dd className="font-medium text-navy">{[record.city, countryName(record.countryCode)].filter(Boolean).join(", ") || "Not supplied"}</dd></div>
          <div><dt className="text-slate">Verification</dt><dd className="font-medium text-navy">{record.verificationStatus.replaceAll("_", " ")}</dd></div></dl>
      </div>
      <div className="rounded-card border border-border bg-white p-5"><h2 className="mb-3 text-compact font-semibold text-navy">Biography</h2><p className="whitespace-pre-wrap text-compact text-slate">{record.bio || "No biography supplied."}</p></div>
      <div className="rounded-card border border-border bg-white p-5"><h2 className="mb-3 text-compact font-semibold text-navy">Services and jurisdictions</h2>
        <p className="text-caption text-slate">Services: {record.serviceSlugs.map(serviceName).join(", ") || "None"}</p>
        <p className="mt-2 text-caption text-slate">Tax jurisdictions: {record.jurisdictionCodes.map(jurisdictionName).join(", ") || "None"}</p>
        <p className="mt-2 text-caption text-slate">Languages: {record.languageCodes.map(languageName).join(", ") || "None"}</p>
      </div>
      <div className="rounded-card border border-border bg-white p-5"><h2 className="mb-3 text-compact font-semibold text-navy">Credentials</h2>
        {record.credentials.length ? <ul className="space-y-2 text-caption text-slate">{record.credentials.map((credential, index) => <li key={`${credential.designation}-${index}`}>{credential.designation}{credential.issuer ? ` · ${credential.issuer}` : ""} · {credential.status === "verified" && credential.reviewedAt ? "Verified" : credential.status === "expired" ? "Expired" : "Not verified"}</li>)}</ul> : <p className="text-caption text-slate">No credentials supplied.</p>}
      </div>
    </section>
    <Link href="/admin/professionals" className="text-caption font-medium text-action hover:underline">Back to professional listings</Link>
  </div>;
}
