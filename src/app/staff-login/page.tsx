import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
import { StaffLoginForm } from "@/components/admin/staff-login-form";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

/**
 * Deliberately outside `src/app/admin/`, so `admin/layout.tsx`'s
 * server-side auth redirect never applies to this page — if it lived at
 * `/admin/login` the layout wrapping it would redirect an unauthenticated
 * visitor away from the only page that lets them become authenticated.
 */
export default function StaffLoginPage() {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-tint">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 select-none text-[13rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[17rem]"
      >
        CMS
      </span>

      <Container className="relative flex w-full max-w-md flex-col gap-6 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo size={36} />
          <h1 className="text-heading-lg font-semibold tracking-tight text-navy">Staff sign-in</h1>
          <p className="text-compact text-slate">
            Content management access for provisioned TaxAccountant.com staff.
          </p>
        </div>

        <div className="rounded-panel border border-border bg-white p-6 shadow-raised sm:p-8">
          <StaffLoginForm />
        </div>
      </Container>
    </section>
  );
}
