import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { AccountAuthForm } from "@/components/shared/account-auth-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TaxAccountant.com account, or create one.",
  alternates: { canonical: "/sign-in" },
  /*
   * noindex: an auth form is not a result anyone should land on from search,
   * and it carries no content of its own worth ranking.
   */
  robots: { index: false, follow: true },
};

interface SignInPageProps {
  searchParams: Promise<{ intent?: string }>;
}

/**
 * Public customer/professional sign-in and sign-up (Phase 2, P2-W1).
 *
 * Replaces the earlier "opens in Phase 2" explainer now that it has —
 * `AccountAuthForm` calls the same Better Auth instance the staff login
 * form uses, and provisions an ordinary `appUsers` row
 * (`convex/users.ts`), never a CMS role. Staff sign-in stays on its own
 * `/staff-login` route, outside this one, same as before.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { intent } = await searchParams;
  const isSignup = intent === "signup";

  return (
    <section className="relative overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 right-[6%] select-none text-[11rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[15rem]"
      >
        2
      </span>

      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <Reveal className="flex max-w-[62ch] flex-col gap-5">
          <h1 className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            {isSignup ? "Create your account" : "Sign in"}
          </h1>
          <p className="text-lead text-slate">
            {isSignup
              ? "A customer account lets you save favorites and searches once those features launch. Browsing and contacting the directory never requires one."
              : "Sign in to your TaxAccountant.com account."}
          </p>
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-1.5 text-compact font-semibold text-action"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to the homepage
          </Link>
        </Reveal>

        <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-white p-6 sm:p-8">
          <AccountAuthForm mode={isSignup ? "signup" : "signin"} />

          {isSignup ? null : (
            <p className="mt-4 text-center text-caption text-slate">
              <Link href="/forgot-password" className="font-medium text-action hover:underline">
                Forgot your password?
              </Link>
            </p>
          )}

          <p className="mt-6 text-center text-caption text-slate">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-action hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/sign-in?intent=signup" className="font-medium text-action hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </Container>
    </section>
  );
}
