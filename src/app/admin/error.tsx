"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * CMS route error boundary.
 *
 * Generic, safe message only — never `error.message` or a stack trace, and
 * never any field of the record being loaded. The `digest` is the
 * server-side correlation id and is safe to show.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[admin] route error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-heading-lg font-semibold text-navy">
          We could not load this CMS screen
        </h1>
        <p className="max-w-[62ch] text-compact text-slate">
          Something went wrong on our side. Retrying loads the same screen again; nothing you
          entered was sent anywhere.
        </p>
        {error.digest ? (
          <p className="text-caption text-slate">
            Reference code: <span className="font-mono text-navy">{error.digest}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Recovery options">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-input bg-action px-4 text-compact font-medium text-white hover:bg-[#0668c7]"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center justify-center rounded-input border border-border bg-white px-4 text-compact font-medium text-navy hover:bg-subtle"
        >
          CMS overview
        </Link>
      </div>
    </div>
  );
}
