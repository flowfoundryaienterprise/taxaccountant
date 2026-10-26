"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

/**
 * Route error boundary for `/countries` and `/countries/[countryCode]`.
 * Generic, safe message only — never `error.message` or a stack trace
 * (API.md section 3).
 */
export default function CountriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[countries] route error", error);
  }, [error]);

  return (
    <Container className="flex flex-col items-start gap-6 py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>

      <div className="flex flex-col gap-3">
        <h1 className="text-heading-lg font-semibold text-navy">
          We could not load this country page
        </h1>
        <p className="max-w-[62ch] text-lead text-slate">
          Something went wrong on our side. Retrying loads the same page again; nothing you entered
          was lost.
        </p>
        {error.digest ? (
          <p className="text-caption text-slate">
            Reference code: <span className="font-mono text-navy">{error.digest}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Recovery options">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/countries" className={cn(buttonVariants({ variant: "outline", size: "md" }))}>
          All countries
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
          Back to homepage
        </Link>
      </div>
    </Container>
  );
}
