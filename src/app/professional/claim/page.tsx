import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { OnboardingWizard } from "@/components/professional/onboarding-wizard";
import { isAuthenticated } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "List your practice",
  robots: { index: false, follow: true },
};

/**
 * `/professional/onboarding` — create-new or claim-existing entry point into
 * the professional listing wizard (Phase 2, P2-W2, Task 9).
 *
 * Same server-side redirect-before-render gate `/organization/new` and
 * `/organization/[id]` already use: `isAuthenticated()` reads the session
 * cookie during SSR, so a signed-out visitor never sees wizard markup at
 * all. It is still only the first line, not the actual security boundary —
 * every mutation this page's client tree calls
 * (`createProfessionalDraft`/`requestProfessionalClaim`/the Task 6 wizard
 * mutations) re-derives the caller's identity and org role from `ctx.auth`
 * server-side and fails closed on its own.
 */
export default async function ProfessionalOnboardingPage() {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=professional-onboarding");
  }

  return (
    <section className="relative overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <Reveal className="flex max-w-[62ch] flex-col gap-5">
          <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            List your practice
          </h1>
          <p className="text-lead text-slate">
            Create a new directory listing for your firm or practice, or claim one that&apos;s
            already published.
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

        <div className="w-full max-w-2xl rounded-[1.5rem] border border-border bg-white p-6 sm:p-8">
          <OnboardingWizard />
        </div>
      </Container>
    </section>
  );
}
