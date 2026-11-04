"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function EnquiryInbox({professionalId}: {professionalId?: Id<"professionals">}) {
  const enquiries = useQuery(api.contact.myEnquiries, {professionalId});
  const options = useQuery(api.contact.enquiryOptions, professionalId ? "skip" : {});
  const create = useMutation(api.contact.createEnquiry);
  const close = useMutation(api.contact.closeEnquiry);
  const [selection, setSelection] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const option = options?.[Number(selection)];
    if (selection === "" || !option) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await create({professionalId: option.professionalId, serviceId: option.serviceId, jurisdictionId: option.jurisdictionId, description});
      setDescription(""); setMessage("Your enquiry has been submitted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit your enquiry."); }
    finally { setBusy(false); }
  }
  return <section id="enquiries" className="rounded-card border border-border bg-white p-5 md:p-6">
    <h2 className="text-xl font-bold text-navy">{professionalId ? "Recent enquiries" : "My enquiries"}</h2>
    <p className="mt-1 text-caption text-slate">Up to 100 enquiries. Only your authorized records are shown.</p>
    {enquiries === undefined ? <p className="py-6" role="status">Loading enquiries…</p> : enquiries.length === 0 ? <p className="py-6 text-slate">No enquiries yet.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-compact"><thead className="bg-tint"><tr><th className="p-3">Enquiry</th><th className="p-3">Submitted</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{enquiries.map(lead => <tr key={lead._id} className="border-b border-border"><td className="max-w-md break-words p-3">{lead.description}</td><td className="whitespace-nowrap p-3">{new Date(lead.createdAt).toLocaleDateString("en-US", {timeZone: "UTC"})}</td><td className="p-3"><span className="rounded-full bg-tint px-3 py-1 capitalize">{lead.status}</span></td><td className="p-3">{lead.status !== "closed" && lead.status !== "canceled" ? <Button variant="outline" size="sm" disabled={busy} onClick={async () => {setBusy(true); setError(""); try {await close({enquiryId: lead._id});} catch(err) {setError(err instanceof Error ? err.message : "Unable to update enquiry.");} finally {setBusy(false);}}}>{professionalId ? "Close" : "Cancel"}</Button> : "—"}</td></tr>)}</tbody></table></div>}
    {!professionalId ? <form onSubmit={submit} className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
      <h3 className="font-semibold">Submit an enquiry</h3>
      <p className="text-caption text-slate">Choose an approved USA professional and their available service. Do not include tax IDs, bank details, or tax documents.</p>
      {options === undefined ? <p role="status">Loading available professionals…</p> : options.length === 0 ? <p className="text-compact text-slate">No approved professionals are accepting enquiries yet.</p> : <>
        <label className="text-compact font-medium">Professional, service and jurisdiction<select required value={selection} onChange={e => setSelection(e.target.value)} className="mt-1 min-h-12 w-full rounded-input border border-control bg-white px-3"><option value="">Select an available service</option>{options.map((o,i) => <option key={`${o.professionalId}-${o.serviceId}-${o.jurisdictionId}`} value={i}>{o.displayName} · {o.serviceName} · {o.jurisdictionName}</option>)}</select></label>
        <label className="text-compact font-medium">How can they help?<textarea required minLength={20} maxLength={2000} rows={4} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-input border border-control p-3" /></label>
        <Button type="submit" disabled={busy} className="self-start">{busy ? "Submitting…" : "Submit enquiry"}</Button>
      </>}
    </form> : null}
    {error ? <p role="alert" className="mt-3 text-danger">{error}</p> : null}
    {message ? <p role="status" className="mt-3 text-action">{message}</p> : null}
  </section>;
}
