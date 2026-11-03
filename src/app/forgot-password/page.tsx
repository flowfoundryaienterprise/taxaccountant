import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { ForgotPasswordForm } from "@/components/shared/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset for your TaxAccountant.com account.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
};

/**
 * Public account password-reset request (Phase 2, P2-W1). See
 * `ForgotPasswordForm` for why the success state never reveals whether the
 * email matched an account.
 */
export default function ForgotPasswordPage() {
  return (
    <section className="relative overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <Reveal className="flex max-w-[62ch] flex-col gap-5">
          <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            Reset your password
          </h1>
          <p className="text-lead text-slate">
            Enter the email on your account and we&apos;ll send you a link to reset your password.
          </p>
          <Link
            href="/sign-in"
            className="group inline-flex w-fit items-center gap-1.5 text-compact font-semibold text-action"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to sign in
          </Link>
        </Reveal>

        <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-white p-6 sm:p-8">
          <ForgotPasswordForm />
        </div>
      </Container>
    </section>
  );
}
