import { redirect } from "next/navigation";
import Link from "next/link";
import { LiveApplications } from "@/components/admin/live-applications";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";

export default async function ApplicationsPage() {
  const staff = await fetchAuthQuery(api.staff.currentStaff, {});
  if (staff?.role !== "cms_admin") redirect("/admin/dashboard");
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Review applications</h1><p className="mt-2 text-slate">Live professional submissions. Decisions are recorded in the audit log.</p></div><nav aria-label="Verification review" className="flex gap-4 text-compact"><Link href="/admin/verification/claims" className="text-action hover:underline">Ownership claims</Link><span aria-current="page" className="font-semibold text-navy">Listing applications</span></nav><LiveApplications /></div>;
}
