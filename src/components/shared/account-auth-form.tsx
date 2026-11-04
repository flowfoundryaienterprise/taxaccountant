"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Briefcase, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export function AccountAuthForm({mode}: {mode: "signin" | "signup"}) {
  const params = useSearchParams();
  const [role, setRole] = React.useState<"customer" | "professional">("customer");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [awaitingSession, setAwaitingSession] = React.useState(false);
  const [provisioned, setProvisioned] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const {isAuthenticated} = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureAppUser);
  const destination = useQuery(api.users.accountDestination, provisioned && isAuthenticated ? {} : "skip");
  const provisioning = React.useRef(false);

  React.useEffect(() => {
    if (!awaitingSession || !isAuthenticated || provisioning.current) return;
    provisioning.current = true;
    ensureUser(mode === "signup" ? {role} : {}).then(() => setProvisioned(true)).catch(() => {
      setError("Your account could not be loaded. Please try signing in again.");
      setBusy(false); setAwaitingSession(false); provisioning.current = false;
    });
  }, [awaitingSession, isAuthenticated, ensureUser, mode, role]);
  React.useEffect(() => {
    if (!destination) return;
    if (destination.startsWith("/login")) return;
    window.location.assign(destination);
  }, [destination]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const result = mode === "signup"
        ? await authClient.signUp.email({name: name.trim(), email: email.trim(), password})
        : await authClient.signIn.email({email: email.trim(), password});
      if (result.error) throw new Error(result.error.message || "Authentication failed.");
      setAwaitingSession(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Please try again."); setBusy(false); }
  }
  const input = "h-12 w-full rounded-input border border-control bg-white px-3 text-compact";
  return <form onSubmit={submit} className="flex flex-col gap-5">
    {params.get("reason") === "not-staff" ? <p role="alert" className="text-compact text-danger">This account has no administrator access. Ask an authorized administrator for an invitation.</p> : null}
    {mode === "signup" ? <>
      <fieldset disabled={busy}><legend className="mb-2 text-compact font-semibold">Create your account as</legend><div className="grid grid-cols-2 gap-3">
        {(["customer", "professional"] as const).map(option => <button key={option} type="button" aria-pressed={role === option} onClick={() => setRole(option)} className={cn("flex flex-col items-start gap-2 rounded-card border p-4 text-left text-compact font-semibold", role === option ? "border-action bg-tint text-action" : "border-border")}>
          {option === "customer" ? <UserRound aria-hidden /> : <Briefcase aria-hidden />}{option === "customer" ? "Customer" : "Service Provider"}
        </button>)}
      </div><p className="mt-3 text-caption text-slate">{role === "customer" ? "Discover professionals and manage your enquiries." : "For CPAs / accountants, bookkeepers, tax attorneys and wealth advisors. Choose your category during onboarding."}</p></fieldset>
      <label className="text-compact font-medium">Full name<input className={input} autoComplete="name" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} disabled={busy} /></label>
    </> : null}
    <label className="text-compact font-medium">Email<input className={input} type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} /></label>
    <label className="text-compact font-medium">Password<input className={input} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} /></label>
    {destination?.startsWith("/login") ? <p role="alert" className="text-compact text-danger">This account is not active. Contact support for assistance.</p> : error ? <p role="alert" className="text-compact text-danger">{error}</p> : null}
    <Button type="submit" size="lg" disabled={busy}>{destination?.startsWith("/login") ? "Account inactive" : busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</Button>
    {destination?.startsWith("/login") ? <Button type="button" variant="outline" onClick={async()=>{try{const result=await authClient.signOut();if(result.error)throw new Error(result.error.message);window.location.reload();}catch{setError("Unable to sign out. Please refresh and try again.");}}}>Sign out and use another account</Button> : null}
    <p className="text-caption text-slate">Administrator accounts are invitation-only.</p>
  </form>;
}
