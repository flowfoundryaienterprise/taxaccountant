import Link from "next/link";
import { UserX } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One answer for three different causes: a mistyped slug, a profile that was
 * never published, and a profile that has been suspended or archived.
 *
 * Deliberately identical in all three cases. Telling a visitor that a profile
 * "exists but is unavailable" would confirm the existence of an unpublished
 * record (API.md section 1: "Avoid leaking whether private objects/accounts
 * exist"), and nothing about the record — not its name, status, or reason —
 * appears on this page or in its metadata.
 */
export default function ProfessionalNotFound() {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Find an Accountant", href: "/find-accountant" },
          { label: "Not found" },
        ]}
      />

      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <UserX className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-heading-lg font-semibold text-navy">
            We could not find that professional profile
          </h1>
          <p className="max-w-[64ch] text-lead text-slate">
            The address may be mistyped, or the profile may not be available for public viewing.
            Searching the directory is the reliable way to find professionals who are listed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/find-accountant" className={cn(buttonVariants({ size: "md" }))}>
            Search the directory
          </Link>
          <Link
            href="/services"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Browse services
          </Link>
          <Link
            href="/countries"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Browse countries
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
            Back to homepage
          </Link>
        </div>
      </div>
    </Container>
  );
}
