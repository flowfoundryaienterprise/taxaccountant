"use client";
import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function LiveApplications({limit=100}: {limit?:number}) {
  const [status,setStatus] = useState<"review"|"published"|"draft">("review");
  const rows = useQuery(api.staff.applicationQueue,{status});
  const publish = useMutation(api.staff.publishProfessional);
  const reject = useMutation(api.staff.rejectProfessional);
  const [selected,setSelected] = useState<Id<"professionals"> | null>(null);
  const [reason,setReason] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const profile = rows?.find(p=>p._id===selected);
  const details = useQuery(api.staff.applicationDetails,selected?{professionalId:selected}:"skip");
  async function decide(approve:boolean) {
    if(!profile) return;
    setBusy(true);setError("");
    try {if(approve) await publish({professionalId:profile._id});else await reject({professionalId:profile._id,reason});setSelected(null);setReason("");}
    catch(err){setError(err instanceof Error?err.message:"Review could not be saved.");}finally{setBusy(false);}
  }
  return <section className="rounded-card border border-border bg-white p-5 md:p-6">
    <h2 className="text-xl font-bold">Professional applications</h2><p className="mt-1 text-compact text-slate">Review profiles before publishing. Up to 100 records per tab.</p>
    <div className="my-4 flex flex-wrap gap-2">{([['review','Pending'],['published','Approved'],['draft','Drafts / needs changes']] as const).map(([key,label])=><Button key={key} variant={status===key?'primary':'outline'} size="sm" aria-pressed={status===key} onClick={()=>{setStatus(key);setSelected(null);}}>{label}</Button>)}</div>
    {rows===undefined?<p role="status">Loading applications…</p>:<div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-compact"><thead className="bg-tint"><tr><th className="p-3">Professional</th><th className="p-3">Type</th><th className="p-3">Location</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{rows.slice(0,limit).map(p=><tr key={p._id} className="border-b border-border"><td className="p-3 font-semibold">{p.displayName}</td><td className="p-3">{p.onboardingDraft?.category.replaceAll('_',' ')??p.kind}</td><td className="p-3">{p.onboardingDraft?.city??'See profile'}</td><td className="p-3"><span className="rounded-full bg-tint px-3 py-1">{p.publicationStatus==='review'?'Pending review':p.publicationStatus}</span></td><td className="p-3"><Button variant="outline" size="sm" onClick={()=>{setSelected(p._id);setError('');setReason('');}}>Review</Button></td></tr>)}</tbody></table>{rows.length===0?<p className="py-6 text-slate">No profiles in this state.</p>:null}</div>}
    {profile?<div className="mt-5 space-y-4 rounded-card border border-border bg-tint p-5"><h3 className="text-lg font-bold">{profile.displayName}</h3><p>{profile.bio}</p><dl className="grid gap-3 text-compact"><div><dt className="font-semibold">Practice</dt><dd>{profile.firmName??'Not supplied'}</dd></div><div><dt className="font-semibold">Self-reported credentials</dt><dd>{profile.onboardingDraft?.credentials.map(c=>`${c.designation} · ${c.issuer}`).join(', ')??'Legacy profile — review existing credential records before publication'}</dd></div><div><dt className="font-semibold">Review status</dt><dd>{profile.verificationStatus}. Publishing does not verify credentials.</dd></div></dl>
      {details?<><h4 className="font-semibold">Services and jurisdictions</h4><ul className="list-inside list-disc text-compact">{details.services.map((s,i)=><li key={i}>{s}</li>)}</ul><h4 className="font-semibold">Credential records</h4><ul className="list-inside list-disc text-compact">{details.credentials.map((s,i)=><li key={i}>{s}</li>)}</ul>{details.photoUrl?<Image unoptimized src={details.photoUrl} width={160} height={160} alt={`${profile.displayName} submitted portrait`} className="rounded-card object-cover" />:null}</>:<p role="status">Loading review details…</p>}
      {profile.publicationStatus==='review'?<><p className="text-compact">Confirm the profile details, selected services, jurisdictions and credentials before publication.</p><label className="block text-compact font-medium">Reason for requesting changes<textarea value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)} className="mt-1 w-full rounded-input border border-control bg-white p-3" /></label><div className="flex flex-wrap gap-3"><Button disabled={busy||!details} onClick={()=>decide(true)}>Approve and publish</Button><Button variant="outline" disabled={busy||!reason.trim()} onClick={()=>decide(false)}>Request changes</Button></div></>:null}
      <button className="text-action underline" onClick={()=>setSelected(null)}>Close review</button>
    </div>:null}
    {error?<p role="alert" className="mt-3 text-danger">{error}</p>:null}
  </section>;
}
