"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Draft = FunctionArgs<typeof api.professionalOwnership.saveOnboardingDraft>["draft"];
const steps = ["Professional category", "Personal information", "Business information", "Profile photograph", "Credentials", "Services", "Location & jurisdictions", "Biography", "Review & submit"];
const categories = [{id: "cpa_accountant", label: "CPA / Accountant"}, {id: "bookkeeper", label: "Bookkeeper"}, {id: "tax_attorney", label: "Tax Attorney"}, {id: "wealth_advisor", label: "Wealth Advisor"}] as const;
const inputClass = "mt-2 w-full rounded-input border border-control bg-white px-3 py-3 text-compact";

export function ProfileOnboarding() {
  const profiles = useQuery(api.professionalOwnership.myProfiles, {});
  const begin = useMutation(api.professionalOwnership.beginOnboarding);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  if (!profiles) return <p role="status">Loading your profile…</p>;
  const draft = profiles.find(p => p.publicationStatus === "draft");
  if (draft) return <OwnedDraft professionalId={draft._id} />;
  if (profiles.length) return <div className="space-y-4"><h2 className="text-2xl font-bold">Your profile has been submitted</h2><p className="text-slate">Review status: {profiles[0].publicationStatus}. Submission does not mean approval or verification.</p><Link href="/professional/dashboard" className="text-action underline">Open your dashboard</Link></div>;
  return <div className="space-y-5"><h2 className="text-2xl font-bold">Introduce your practice</h2><p className="text-slate">Complete nine short steps. You can save your draft and return at any time. We currently accept USA-based practices.</p>
    <Button disabled={busy} onClick={async () => {setBusy(true); setError(null); try {await begin({});} catch(err) {setError(err instanceof Error ? err.message : "Could not start your profile.");} finally {setBusy(false);} }}>{busy ? "Starting…" : "Create my profile"}</Button>
    <p className="text-compact">Already listed? <Link href="/professional/claim" className="text-action underline">Request ownership of an existing listing</Link></p>{error ? <p role="alert" className="text-danger">{error}</p> : null}
  </div>;
}
function OwnedDraft({professionalId}: {professionalId: Id<"professionals">}) {
  const saved = useQuery(api.professionalOwnership.getOwnedProfile, {professionalId});
  if (!saved) return <p role="status">Loading saved draft…</p>;
  return <DraftForm key={professionalId} professionalId={professionalId} initial={saved.profile.onboardingDraft ?? {step:0, category:"cpa_accountant", displayName:saved.profile.displayName, businessName:saved.profile.firmName ?? "", bio:saved.profile.bio, city:"", region:"", serviceIds:[], jurisdictionIds:[], credentials:[{designation:"", issuer:""}], remote:true}} photoUrl={saved.photoUrl} />;
}
function DraftForm({professionalId, initial, photoUrl}: {professionalId: Id<"professionals">; initial: Draft; photoUrl: string | null}) {
  const [draft, setDraft] = React.useState<Draft>(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const save = useMutation(api.professionalOwnership.saveOnboardingDraft);
  const submit = useMutation(api.professionalOwnership.submitOnboarding);
  const upload = useAction(api.professionalOwnership.uploadProfilePhoto);
  const countries = useQuery(api.taxonomy.listCountries, {});
  const services = useQuery(api.taxonomy.listServiceCategories, {});
  const jurisdictions = useQuery(api.taxonomy.listTaxJurisdictions, draft.countryId ? {countryId:draft.countryId} : "skip");
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => {setDraft(d=>({...d,[key]:value})); setMessage("");};
  function stepError() {
    if (draft.step === 1 && !draft.displayName.trim()) return "Enter your full name.";
    if (draft.step === 2 && !draft.businessName.trim()) return "Enter your practice or business name.";
    if (draft.step === 3 && !photoUrl) return "Upload your profile photograph.";
    if (draft.step === 4 && !draft.credentials.some(c=>c.designation.trim())) return "Add at least one credential or professional designation.";
    if (draft.step === 5 && !draft.serviceIds.length) return "Choose at least one service.";
    if (draft.step === 6 && (!draft.countryId || !draft.city.trim() || !draft.jurisdictionIds.length)) return "Choose your location and at least one practice jurisdiction.";
    if (draft.step === 7 && draft.bio.trim().length < 50) return "Write a biography of at least 50 characters.";
    return null;
  }
  async function persist(next: number, validate: boolean) {
    setError(null); setMessage("");
    const problem = validate ? stepError() : null;
    if (problem) {setError(problem); return;}
    setBusy(true);
    try {const update = {...draft, step:next}; await save({professionalId,draft:update}); setDraft(update); setMessage("Draft saved.");}
    catch(err) {setError(err instanceof Error ? err.message : "Could not save. Your changes are still on this page.");}
    finally {setBusy(false);}
  }
  return <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
    <nav aria-label="Onboarding progress"><p className="mb-3 text-caption font-bold uppercase tracking-wide text-action">Step {draft.step+1} of 9</p><progress className="mb-5 h-2 w-full accent-action" value={draft.step+1} max={9} aria-label="Profile completion steps" /><ol className="flex gap-2 overflow-x-auto lg:flex-col">{steps.map((label,i)=><li key={label} aria-current={i===draft.step ? "step" : undefined} className={cn("shrink-0 rounded-input px-3 py-2 text-compact",i===draft.step ? "bg-action font-semibold text-white" : "text-slate")}><span className="mr-2">{i+1}.</span>{label}</li>)}</ol></nav>
    <form onSubmit={e=>{e.preventDefault(); if(draft.step<8) void persist(draft.step+1,true);}} className="min-w-0 space-y-6">
      <div><h2 className="text-2xl font-bold">{steps[draft.step]}</h2><p className="mt-2 text-compact text-slate">Your profile remains private until it is reviewed and published.</p></div>
      <fieldset disabled={busy} className="space-y-5">
      {draft.step===0 ? <div className="grid gap-3 sm:grid-cols-2">{categories.map(c=><label key={c.id} className={cn("flex cursor-pointer items-center gap-3 rounded-card border p-4",draft.category===c.id ? "border-action bg-tint" : "border-border")}><input type="radio" name="category" checked={draft.category===c.id} onChange={()=>change("category",c.id)} />{c.label}</label>)}</div> : null}
      {draft.step===1 ? <label className="block text-compact font-semibold">Full name<input className={inputClass} value={draft.displayName} maxLength={120} autoComplete="name" onChange={e=>change("displayName",e.target.value)} /></label> : null}
      {draft.step===2 ? <><label className="block text-compact font-semibold">Practice or business name<input className={inputClass} value={draft.businessName} maxLength={160} autoComplete="organization" onChange={e=>change("businessName",e.target.value)} /></label><label className="flex gap-3 text-compact"><input type="checkbox" checked={draft.remote} onChange={e=>change("remote",e.target.checked)} />I offer remote consultations</label></> : null}
      {draft.step===3 ? <div className="space-y-4">{photoUrl ? <Image src={photoUrl} alt="Your uploaded profile photograph" width={200} height={160} unoptimized className="h-40 w-48 rounded-card object-cover" /> : <div className="flex h-40 w-48 items-center justify-center rounded-card bg-tint text-slate">No photo uploaded</div>}<label className="block text-compact font-semibold">Profile photograph<input type="file" accept="image/jpeg,image/png" className={inputClass} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError(null);try{if(file.size>750000)throw new Error("Choose a JPG or PNG smaller than 750 KB.");await upload({professionalId,bytes:await file.arrayBuffer()});setMessage("Photograph saved.");}catch(err){setError(err instanceof Error?err.message:"Upload failed.");}finally{setBusy(false);}}} /></label><p className="text-caption text-slate">JPG or PNG, up to 750 KB. Upload a photograph you have permission to use.</p></div> : null}
      {draft.step===4 ? <div className="space-y-4">{draft.credentials.map((c,i)=><div key={i} className="grid gap-3 rounded-card border border-border p-4 sm:grid-cols-2"><label className="text-compact font-semibold">Designation<input className={inputClass} value={c.designation} maxLength={100} onChange={e=>change("credentials",draft.credentials.map((x,j)=>j===i?{...x,designation:e.target.value}:x))} /></label><label className="text-compact font-semibold">Issuing organization<input className={inputClass} value={c.issuer} maxLength={160} onChange={e=>change("credentials",draft.credentials.map((x,j)=>j===i?{...x,issuer:e.target.value}:x))} /></label></div>)}<Button type="button" variant="outline" disabled={draft.credentials.length>=10} onClick={()=>change("credentials",[...draft.credentials,{designation:"",issuer:""}])}>Add credential</Button><p className="text-caption text-slate">Credentials are self-declared and remain unverified until reviewed.</p></div> : null}
      {draft.step===5 ? <div className="grid gap-3 sm:grid-cols-2">{services?.map(s=><label key={s.serviceId} className="flex items-center gap-3 rounded-input border border-border p-3 text-compact"><input type="checkbox" checked={draft.serviceIds.includes(s.serviceId)} onChange={e=>change("serviceIds",e.target.checked?[...draft.serviceIds,s.serviceId]:draft.serviceIds.filter(id=>id!==s.serviceId))} />{s.name}</label>)}{services?.length===0 ? <p className="text-slate">Service options are not configured yet. Save your draft and return later.</p> : null}</div> : null}
      {draft.step===6 ? <><label className="block text-compact font-semibold">Country<select className={inputClass} value={draft.countryId ?? ""} onChange={e=>setDraft(d=>({...d,countryId:e.target.value as Id<"countries"> || undefined,jurisdictionIds:[]}))}><option value="">Select country</option>{countries?.filter(c=>c.code==="US").map(c=><option key={c.countryId} value={c.countryId}>{c.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-compact font-semibold">City<input className={inputClass} maxLength={100} value={draft.city} onChange={e=>change("city",e.target.value)} /></label><label className="text-compact font-semibold">State<input className={inputClass} maxLength={100} value={draft.region} onChange={e=>change("region",e.target.value)} /></label></div><fieldset><legend className="mb-3 text-compact font-semibold">Practice jurisdictions</legend><div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{jurisdictions?.map(j=><label key={j.jurisdictionId} className="flex gap-2 text-compact"><input type="checkbox" checked={draft.jurisdictionIds.includes(j.jurisdictionId)} onChange={e=>change("jurisdictionIds",e.target.checked?[...draft.jurisdictionIds,j.jurisdictionId]:draft.jurisdictionIds.filter(id=>id!==j.jurisdictionId))} />{j.label}</label>)}</div></fieldset></> : null}
      {draft.step===7 ? <label className="block text-compact font-semibold">Professional biography<textarea rows={8} className={inputClass} maxLength={4000} value={draft.bio} onChange={e=>change("bio",e.target.value)} /><span className="mt-2 block text-caption font-normal text-slate">Describe your experience and practice. 50–4,000 characters; {draft.bio.length} entered.</span></label> : null}
      {draft.step===8 ? <div className="space-y-4 rounded-card border border-border bg-tint p-5"><h3 className="text-xl font-bold">{draft.displayName}</h3><p>{draft.businessName} · {categories.find(c=>c.id===draft.category)?.label}</p><p className="text-compact">{draft.city}, {draft.region} · United States</p><p className="whitespace-pre-wrap text-compact text-slate">{draft.bio}</p><p className="text-compact">{draft.serviceIds.length} services · {draft.jurisdictionIds.length} jurisdictions · {draft.credentials.filter(c=>c.designation.trim()).length} credentials</p><p className="text-compact font-semibold">Submission requests a review. It does not publish or verify your profile.</p></div> : null}
      </fieldset>
      {error ? <p role="alert" className="text-compact text-danger">{error}</p> : null}{message ? <p role="status" className="text-compact text-success">{message}</p> : null}
      <div className="flex flex-wrap gap-3 border-t border-border pt-5"><Button type="button" variant="outline" disabled={busy||draft.step===0} onClick={()=>void persist(draft.step-1,false)}>Back</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>void persist(draft.step,false)}>Save draft</Button>{draft.step<8 ? <Button type="submit" disabled={busy}>{busy?"Saving…":"Next"}</Button> : <Button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError(null);try{await save({professionalId,draft});await submit({professionalId});window.location.assign("/professional/dashboard");}catch(err){setError(err instanceof Error?err.message:"Submission failed. Please try again.");setBusy(false);}}}>{busy?"Submitting…":"Submit for review"}</Button>}</div>
    </form>
  </div>;
}
