import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Public customer and professional accounts launch in Phase 2.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: true },
};

interface SignInPageProps {
  searchParams: Promise<{ intent?: string }>;
}

/**
 * ARCHITECTURE.md section 6: "No customer/professional public registration
 * until Phase 2." Phase 1 only provisions restricted staff CMS identities,
 * so Sign In and Create an Account share this honest explainer rather than
 * a form that can't actually authenticate anyone yet.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { intent } = await searchParams;
  const isSignup = intent === "signup";

  return (
    <Container className="flex flex-col gap-6 py-16">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tint px-3 py-1 text-caption font-semibold text-action">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        Phase 2 feature
      </span>
      <h1 className="text-heading-lg font-semibold text-navy">
        {isSignup ? "Account creation opens in Phase 2" : "Public sign-in opens in Phase 2"}
      </h1>
      <p className="max-w-[60ch] text-lead text-slate">
        Phase 1 of TaxAccountant.com is a public directory you can browse without an account.
        Customer, business and professional accounts — with multi-factor authentication and
        organization roles — are scoped for Phase 2 of the build. Staff CMS access in Phase 1 is
        provisioned directly, not through public sign-up.
      </p>
      <Link href="/" className="text-compact font-semibold text-action">
        &larr; Back to the homepage
      </Link>
    </Container>
  );
}
