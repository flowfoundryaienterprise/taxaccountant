"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export function OwnedProfiles() {
 const profiles=useQuery(api.professionalOwnership.myProfiles,{});
 const reopen=useMutation(api.professionalOwnership.reopenForEditing);
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 if(!profiles) return <p role="status">Loading profiles…</p>;
 return <div className="space-y-5">{profiles.map(p=><article key={p._id} className="space-y-4 rounded-card border border-border bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">{p.displayName}</h2><span className="rounded-full bg-tint px-3 py-1 text-compact">{p.publicationStatus === "review" ? "Pending review" : p.publicationStatus}</span></div><p className="text-slate">{p.firmName}</p><p className="whitespace-pre-wrap text-compact">{p.bio || "Your biography is still in draft."}</p><p className="text-caption text-slate">Credential verification: {p.verificationStatus.replaceAll("_"," ")}</p>
 {p.reviewFeedback ? <p className="rounded-input bg-tint p-3 text-compact">Review feedback: {p.reviewFeedback}</p> : null}
 {p.publicationStatus==="draft" ? <Link href="/professional/onboarding" className="font-semibold text-action">Continue editing →</Link> : p.onboardingDraft && (p.publicationStatus==="review"||p.publicationStatus==="published") ? <><p className="text-compact text-slate">Editing withdraws this profile from publication and requires another review.</p><Button disabled={busy} onClick={async()=>{setBusy(true);setError(null);try{await reopen({professionalId:p._id});window.location.assign("/professional/onboarding");}catch(err){setError(err instanceof Error?err.message:"Unable to edit profile.");setBusy(false);}}}>Withdraw and edit profile</Button></> : null}</article>)}{!profiles.length?<Link href="/professional/onboarding" className="text-action underline">Create your profile</Link>:null}{error?<p role="alert" className="text-danger">{error}</p>:null}</div>;
}
