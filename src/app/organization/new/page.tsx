import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { CreateOrganizationForm } from "@/components/organization/create-organization-form";
import { isAuthenticated } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Create an organization",
  robots: { index: false, follow: true },
};

/**
 * `/organization/new` — create a new organization and become its owner
 * (Phase 2, P2-W2).
 *
 * Gated the same shape `/admin/layout.tsx` uses for staff — a server-side
 * redirect before any child markup renders — adapted for plain account auth
 * rather than a staff role: `isAuthenticated()` reads the session cookie via
 * vinext's `next/headers` shim, same as `/admin`, but this route has no
 * further role to check. Any signed-in `appUsers` identity may create an
 * organization; `createOrganization` (`convex/organizations.ts`) itself
 * re-derives that identity from `ctx.auth` and requires an active account,
 * so this redirect is the first line, not the actual security boundary.
 */
export default async function NewOrganizationPage() {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?intent=organization-new");
  }

  return (
    <section className="relative overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-20 sm:py-28">
        <Reveal className="flex max-w-[62ch] flex-col gap-5">
          <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
            Create an organization
          </h1>
          <p className="text-lead text-slate">
            An organization is how you and your team work together here — invite members and
            manage access from its page once it&apos;s created.
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
          <CreateOrganizationForm />
        </div>
      </Container>
    </section>
  );
}
