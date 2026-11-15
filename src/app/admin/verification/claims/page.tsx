import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { ClaimsQueue } from "@/components/admin/claims-queue";
import { fetchAuthQuery } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Ownership claims" };

export default async function ClaimsReviewPage() {
  const staff = await fetchAuthQuery(api.staff.currentStaff, {});
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-semibold text-navy">Ownership claims</h1><p className="mt-2 text-compact text-slate">Review requests from professional firms to manage existing listings.</p></div>
    {staff?.role === "cms_admin" ? <nav aria-label="Verification review" className="flex gap-4 text-compact"><span aria-current="page" className="font-semibold text-navy">Claims</span><Link href="/admin/verification/listings" className="text-action hover:underline">Listing applications</Link></nav> : null}
    <ClaimsQueue />
  </div>;
}
