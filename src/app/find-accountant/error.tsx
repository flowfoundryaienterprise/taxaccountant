"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

/**
 * Route error boundary.
 *
 * Shows a safe, generic message and never renders `error.message` or a stack
 * trace (API.md section 3: "all errors safe for display; no stack traces in
 * responses"). The search URL is untouched, so Retry re-runs the exact same
 * search and the user keeps their filters — the details go to the console for
 * developers only.
 */
export default function FindAccountantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[find-accountant] route error", error);
  }, [error]);

  return (
    <Container className="flex flex-col items-start gap-6 py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>

      <div className="flex flex-col gap-3">
        <h1 className="text-heading-lg font-semibold text-navy">
          We could not load the directory
        </h1>
        <p className="max-w-[62ch] text-lead text-slate">
          Something went wrong while loading professionals. Your search is still in the address
          bar, so retrying keeps the filters you selected.
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
        <Link
          href="/find-accountant"
          className={cn(buttonVariants({ variant: "outline", size: "md" }))}
        >
          Start a new search
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
          Back to homepage
        </Link>
      </div>
    </Container>
  );
}
