"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { LogIn, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { api } from "@/convex/_generated/api";

/**
 * Staff-only sign-in. No sign-up link anywhere on this page by design —
 * Phase 1 staff accounts are provisioned directly, not self-registered
 * (ARCHITECTURE.md section 6). The actual gate is server-side
 * (`admin/layout.tsx` + `convex/staff.ts`'s `currentStaff`): a Better Auth
 * account with no active `staffMemberships` row still gets redirected back
 * here after signing in, which is what the `reason=not-staff` state below
 * explains.
 */
export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notStaff = searchParams.get("reason") === "not-staff";
  const claimFirstStaffAccount = useMutation(api.staff.claimFirstStaffAccount);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [claiming, setClaiming] = React.useState(false);
  const [claimError, setClaimError] = React.useState<string | null>(null);

  async function handleClaim() {
    setClaiming(true);
    setClaimError(null);
    try {
      await claimFirstStaffAccount({});
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setClaimError(
        err instanceof Error ? err.message : "Could not claim the admin role — it may already be taken.",
      );
      setClaiming(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "Sign-in failed. Check the email and password and try again.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {notStaff ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-card border border-warning/30 bg-white px-4 py-3 text-compact text-slate"
        >
          <p>
            That account signed in, but has no active CMS role. Ask an existing{" "}
            <span className="font-medium text-navy">cms_admin</span> to add you in{" "}
            <code className="rounded bg-subtle px-1 py-0.5 font-mono text-caption text-navy">
              staffMemberships
            </code>
            .
          </p>
          <p className="text-caption text-slate">
            No staff account exists yet on this deployment? The first signed-in account may claim
            <span className="font-medium text-navy"> cms_admin</span> once — this only works before
            any <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">staffMemberships</code>{" "}
            row exists.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="inline-flex h-10 w-fit items-center gap-1.5 rounded-input border border-control bg-white px-4 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-action" aria-hidden />
            {claiming ? "Claiming…" : "Claim first admin account"}
          </button>
          {claimError ? (
            <p role="alert" className="text-caption font-medium text-danger">
              {claimError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="staff-email" className="text-caption font-medium text-slate">
          Email
        </label>
        <input
          id="staff-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="staff-password" className="text-caption font-medium text-slate">
          Password
        </label>
        <input
          id="staff-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <LogIn className="h-4 w-4" aria-hidden />
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
