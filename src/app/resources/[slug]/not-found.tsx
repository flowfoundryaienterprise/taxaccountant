import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Unknown or unpublished resource slug.
 *
 * One answer for both, deliberately: a draft, a resource in review and a
 * typo are indistinguishable from here, so the existence of unpublished
 * content is never disclosed.
 */
export default function ResourceNotFound() {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Guides & Resources", href: "/resources" },
          { label: "Not found" },
        ]}
      />

      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <BookOpen className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-heading-lg font-semibold text-navy">We could not find that guide</h1>
          <p className="max-w-[64ch] text-lead text-slate">
            The address may be mistyped, or the guide may not be available. Everything currently
            published is listed on the resources index.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/resources" className={cn(buttonVariants({ size: "md" }))}>
            All resources
          </Link>
          <Link
            href="/find-accountant"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            Find an Accountant
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
            Back to homepage
          </Link>
        </div>
      </div>
    </Container>
  );
}
