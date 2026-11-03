"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

/**
 * Requests a password-reset email (Phase 2, P2-W1). Always shows the same
 * success state regardless of whether the email matches an account —
 * Better Auth's `requestPasswordReset` already doesn't reveal that, and the
 * UI shouldn't either (API.md section 1: "Avoid leaking whether private
 * objects/accounts exist").
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setSubmitting(false);

    if (authError) {
      setError(authError.message ?? "Could not send a reset email. Try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-compact text-navy">
        If an account exists for <span className="font-medium">{email}</span>, a reset link is on
        its way. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-password-email" className="text-caption font-medium text-slate">
          Email
        </label>
        <input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <Mail className="h-4 w-4" aria-hidden />
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
