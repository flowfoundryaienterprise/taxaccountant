import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const destinations = [
  { label: "Find an Accountant", href: "/find-accountant", description: "Search the professional directory." },
  { label: "Services", href: "/services", description: "Browse every service category." },
  { label: "Countries", href: "/countries", description: "Explore countries open for discovery." },
  {
    label: "For Professionals",
    href: "/for-professionals",
    description: "How professional listing will work.",
  },
];

/**
 * Site-wide 404. Route-level `not-found.tsx` files under `/services` and
 * `/countries` handle their own cases with more specific recovery; this
 * catches everything else. No internal detail about the failed route is
 * exposed.
 */
export default function NotFound() {
  return (
    <Container className="flex flex-col gap-10 py-20">
      <div className="flex flex-col items-start gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <Compass className="h-6 w-6" aria-hidden />
        </span>

        <div className="flex flex-col gap-3">
          <p className="text-caption text-slate">
            404
          </p>
          <h1 className="text-heading-lg font-semibold text-navy">
            We could not find that page
          </h1>
          <p className="max-w-[62ch] text-lead text-slate">
            The address may be mistyped, or the page may not be built yet — TaxAccountant.com is in
            Phase 1 and not every planned section exists.
          </p>
        </div>

        <Link href="/" className={cn(buttonVariants({ size: "md" }))}>
          Back to homepage
        </Link>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((destination) => (
          <li key={destination.href}>
            <Link
              href={destination.href}
              className="flex h-full flex-col gap-1.5 rounded-card border border-border bg-white p-5 transition-colors duration-200 hover:border-action"
            >
              <span className="text-compact font-semibold text-navy">{destination.label}</span>
              <span className="text-caption text-slate">{destination.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
