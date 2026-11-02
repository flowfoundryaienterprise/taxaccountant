"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

interface AccountAuthFormProps {
  /** `signup` shows the name field and a different submit label/copy. */
  mode: "signin" | "signup";
}

/**
 * Public customer/professional account sign-in and sign-up (Phase 2, P2-W1).
 *
 * The same `authClient` the staff login form uses (`@/lib/auth/client`) —
 * one Better Auth instance for the whole app. What makes this a *public*
 * account rather than staff access is that nothing here checks
 * `staffMemberships`, and the only privilege a successful sign-up grants is
 * an ordinary `appUsers` row — provisioned by `EnsureAppUser`
 * (`@/components/shared/ensure-app-user`), not by this form directly. See
 * that component's own comment for why: calling `ensureAppUser` here,
 * immediately after this promise resolves, raced the Convex client's own
 * auth-token refresh and could provision the row under the *previous*
 * session instead of this one.
 *
 * MFA, password recovery and organization membership are the rest of
 * P2-W1/W2 and aren't in this form yet — it's the sign-up/sign-in half of
 * that milestone, shipped first because every later Phase 2 screen needs an
 * `appUsers` row to exist before it can be built against one.
 */
export function AccountAuthForm({ mode }: AccountAuthFormProps) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: name.trim() || email })
        : await authClient.signIn.email({ email, password });

    if (authError) {
      setSubmitting(false);
      setError(
        authError.message ??
          (mode === "signup"
            ? "Could not create an account with those details."
            : "Sign-in failed. Check the email and password and try again."),
      );
      return;
    }

    /*
     * Deliberately no `router.refresh()` here (unlike the staff login form,
     * which needs one so `/admin`'s server layout re-checks auth via
     * `fetchAuthQuery`). The redirect target is the public homepage, which
     * has no server-side auth gate — `router.refresh()` forces a fresh
     * server render that re-reads the session cookie, and confirmed live
     * this can race the browser committing the sign-up response's
     * Set-Cookie header, producing an `initialToken`
     * (`ConvexClientProvider`) from the *previous* session that then wins
     * over the real one. Client-side reactivity (`EnsureAppUser`'s
     * `useQuery`) doesn't have this race — it isn't SSR-sourced at all.
     */
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {mode === "signup" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-name" className="text-caption font-medium text-slate">
            Name
          </label>
          <input
            id="account-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-email" className="text-caption font-medium text-slate">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-password" className="text-caption font-medium text-slate">
          Password
        </label>
        <input
          id="account-password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        {mode === "signup" ? (
          <p className="text-caption text-slate/70">At least 8 characters.</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {mode === "signup" ? (
          <UserPlus className="h-4 w-4" aria-hidden />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden />
        )}
        {submitting ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
