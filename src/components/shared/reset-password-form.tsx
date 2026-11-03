"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

interface ResetPasswordFormProps {
  /** Read server-side from the URL by the page (`?token=`, `?error=`) and
   * passed down, rather than read client-side via `useSearchParams`, so
   * this component needs no Suspense boundary. */
  token: string | null;
  tokenError: string | null;
}

/**
 * Completes a password reset (Phase 2, P2-W1). `token` arrives as a query
 * param — Better Auth's `/reset-password/:token` callback route validates
 * the emailed token server-side and redirects here with `?token=` attached
 * only once that validation passes (never trust a client-supplied token
 * without that round-trip; this form merely forwards it to
 * `resetPassword`, which re-validates it again server-side).
 */
export function ResetPasswordForm({ token, tokenError }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!token || tokenError) {
    return (
      <p role="alert" className="text-compact text-navy">
        This reset link is invalid or has expired. Request a new one from the{" "}
        <a href="/forgot-password" className="font-medium text-action hover:underline">
          forgot password
        </a>{" "}
        page.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token: token ?? undefined,
    });

    setSubmitting(false);

    if (authError) {
      setError(authError.message ?? "Could not reset the password. Request a new link and try again.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/sign-in"), 2000);
  }

  if (done) {
    return (
      <p className="text-compact text-navy">
        Password updated. Redirecting you to sign in…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-password-new" className="text-caption font-medium text-slate">
          New password
        </label>
        <input
          id="reset-password-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <p className="text-caption text-slate/70">At least 8 characters.</p>
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <KeyRound className="h-4 w-4" aria-hidden />
        {submitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
