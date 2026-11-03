import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { ResetPasswordForm } from "@/components/shared/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your TaxAccountant.com account.",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: true },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

/**
 * Public account password-reset completion (Phase 2, P2-W1). Better Auth's
 * `/reset-password/:token` server route validates the emailed token and
 * redirects here with `?token=` (or `?error=INVALID_TOKEN`) attached —
 * `token`/`error` are read server-side and passed to `ResetPasswordForm`
 * rather than via `useSearchParams`, matching `/sign-in`'s pattern and
 * avoiding a client-side Suspense boundary.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return (
    <section className="relative overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <Reveal className="flex max-w-[62ch] flex-col gap-5">
          <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            Choose a new password
          </h1>
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
          <ResetPasswordForm token={token ?? null} tokenError={error ?? null} />
        </div>
      </Container>
    </section>
  );
}
