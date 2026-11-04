"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";
export function SidebarSignout() {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(false);
  return <div><button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError(false);try{const result=await authClient.signOut();if(result.error)throw new Error("Sign out failed");window.location.assign('/');}catch{setBusy(false);setError(true);}}} className="mt-3 flex items-center gap-3 text-compact font-medium text-white/80 hover:text-white disabled:opacity-50"><LogOut className="h-4 w-4" aria-hidden />{busy?'Signing out…':'Logout'}</button>{error?<p role="alert" className="mt-2 text-caption text-white">Unable to sign out. Please try again.</p>:null}</div>;
}
