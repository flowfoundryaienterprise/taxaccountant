import Link from "next/link";
import { SearchX } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { ServiceGrid } from "@/components/services/service-grid";
import { buttonVariants } from "@/components/ui/button";
import { serviceCatalog } from "@/lib/marketplace/services";
import { cn } from "@/lib/utils";

/**
 * Invalid or retired service slug.
 *
 * Returns a real 404 (this file is rendered by `notFound()` in the page) and
 * recovers by listing the service categories that do exist, rather than
 * dead-ending. No internal detail about why the slug failed is exposed.
 */
export default function ServiceNotFound() {
  return (
    <Container className="flex flex-col gap-10 py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: "Not found" },
        ]}
      />

      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <SearchX className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-heading-lg font-semibold text-navy">
            That service page does not exist
          </h1>
          <p className="max-w-[64ch] text-lead text-slate">
            The address may be mistyped, or the category may have been renamed. Every service
            category currently published is listed below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/services" className={cn(buttonVariants({ size: "md" }))}>
            All services
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

      <ServiceGrid services={serviceCatalog} columns={4} animate={false} />
    </Container>
  );
}
