"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

interface UnsavedChangesDialogProps {
  /** Whether the form currently differs from the loaded record. */
  dirty: boolean;
  /** Where Cancel goes when there is nothing to lose. */
  cancelHref: string;
  label?: string;
}

/**
 * Guards navigation away from an edited form.
 *
 * Two distinct cases, because they are not equally recoverable:
 *
 *  - **Leaving the tab** (reload, close, external link) — handled by
 *    `beforeunload`, which is the only hook the platform offers. The browser
 *    shows its own wording; a custom message has not been honoured for
 *    years.
 *  - **Following Cancel inside the app** — handled by this dialog, where the
 *    consequence can be stated accurately.
 *
 * That accuracy matters right now: there is no save, so "your changes will
 * be lost" is unconditionally true rather than "unless you save first". The
 * wording says so plainly instead of implying a save is available.
 *
 * `<dialog>` is used for the modal so focus handling, Escape and the
 * backdrop come from the platform rather than from a hand-rolled focus trap.
 */
export function UnsavedChangesDialog({
  dirty,
  cancelHref,
  label = "Cancel",
}: UnsavedChangesDialogProps) {
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by some browsers to trigger the native prompt.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const leave = () => {
    dialogRef.current?.close();
    router.push(cancelHref);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (dirty ? dialogRef.current?.showModal() : router.push(cancelHref))}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-input px-4 text-compact font-medium text-slate hover:bg-subtle"
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="unsaved-title"
        className="w-[min(30rem,calc(100vw-2rem))] rounded-panel border border-border bg-white p-0 text-navy backdrop:bg-navy/40"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-warning">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <h2 id="unsaved-title" className="text-compact font-medium text-navy">
                  Discard your changes?
                </h2>
                <p className="text-caption text-slate">
                  This editor has unsaved changes. Saving is not available yet, so leaving this
                  screen discards them permanently — there is nowhere for them to be kept.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-slate hover:bg-subtle"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-11 items-center justify-center rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-subtle"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={leave}
              className="inline-flex min-h-11 items-center justify-center rounded-input bg-action px-4 text-compact font-medium text-white hover:bg-[#0668c7]"
            >
              Discard and leave
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
