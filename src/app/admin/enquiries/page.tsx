import { redirect } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth/server";
import { api } from "@/convex/_generated/api";
export default async function EnquiriesPage() {
  const staff=await fetchAuthQuery(api.staff.currentStaff,{});
  if(staff?.role!=="cms_admin")redirect('/admin/dashboard');
  const leads=await fetchAuthQuery(api.staff.latestEnquiries,{});
  return <div className="space-y-6"><header><h1 className="text-3xl font-bold">Enquiries</h1><p className="mt-2 text-slate">The latest 100 customer enquiries to professionals.</p></header><div className="overflow-x-auto rounded-card border border-border bg-white p-5"><table className="w-full min-w-[640px] text-left text-compact"><thead className="bg-tint"><tr><th className="p-3">Service / enquiry</th><th className="p-3">Professional</th><th className="p-3">Status</th><th className="p-3">Submitted</th></tr></thead><tbody>{leads.map(lead=><tr key={lead.id} className="border-b border-border"><td className="max-w-lg p-3"><p className="font-semibold">{lead.service}</p><p className="mt-1 break-words text-slate">{lead.description}</p></td><td className="p-3">{lead.professional}</td><td className="p-3 capitalize">{lead.status}</td><td className="whitespace-nowrap p-3">{new Date(lead.createdAt).toLocaleDateString('en-US',{timeZone:'UTC'})}</td></tr>)}</tbody></table>{!leads.length?<p className="py-6 text-slate">No enquiries have been submitted.</p>:null}</div></div>;
}
