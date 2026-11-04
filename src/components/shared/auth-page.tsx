import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { AccountAuthForm } from "@/components/shared/account-auth-form";
export function AuthPage({mode}: {mode: "signin" | "signup"}) {
 const signup = mode === "signup";
 return <section className="bg-tint py-12 sm:py-20"><Container className="grid items-center gap-12 lg:grid-cols-2">
  <div><p className="text-caption font-bold uppercase tracking-[0.16em] text-action">TaxAccountant</p><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{signup ? "Your next chapter starts here." : "Welcome back."}</h1><p className="mt-5 max-w-md text-lead text-slate">{signup ? "Find professional expertise, or bring yours to the marketplace." : "One account for your tax and accounting connections."}</p><p className="mt-8 flex items-center gap-2 text-compact text-slate"><ShieldCheck className="text-action" aria-hidden />Your account. Your workspace.</p></div>
  <div className="w-full max-w-lg rounded-panel border border-border bg-white p-6 shadow-sm sm:p-9"><h2 className="mb-6 text-2xl font-bold">{signup ? "Create an account" : "Sign in"}</h2><AccountAuthForm mode={mode} />
   {!signup ? <Link href="/forgot-password" className="mt-4 block text-compact text-action hover:underline">Forgot your password?</Link> : null}
   <p className="mt-6 border-t border-border pt-5 text-compact text-slate">{signup ? "Already have an account? " : "New to TaxAccountant? "}<Link href={signup ? "/login" : "/signup"} className="font-semibold text-action hover:underline">{signup ? "Sign in" : "Create an account"}</Link></p>
  </div>
 </Container></section>;
}
