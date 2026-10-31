"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface DeleteConfirmationProps {
  /** What is being deleted, e.g. "About TaxAccountant.com". */
  recordName: string;
  recordType: string;
  /** Extra consequence the editor should know before confirming. */
  consequence?: string;
  className?: string;
}

/**
 * Destructive-action confirmation.
 *
 * DESIGN.md section 8: "Destructive CMS actions require confirmation,
 * appropriate permissions and an auditable result." The confirmation design
 * is built here; the other two do not exist yet, so the final button is
 * **disabled** and says why.
 *
 * It requires the record name to be typed before enabling, which is the
 * pattern worth designing in now — it is what stops a mis-click deleting
 * published content once the mutation is real.
 *
 * Deliberately a `<dialog>`: focus handling, Escape-to-close and the
 * backdrop come from the platform rather than from a hand-built modal that
 * would need its own focus trap to be accessible.
 */
export function DeleteConfirmation({
  recordName,
  recordType,
  consequence,
  className,
}: DeleteConfirmationProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = React.useState("");

  const open = () => {
    setTyped("");
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const matches = typed.trim() === recordName.trim();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-input border border-control bg-white px-3 text-caption font-medium text-danger transition-colors duration-150 hover:bg-subtle",
          className,
        )}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-dialog-title"
        className="w-[min(32rem,calc(100vw-2rem))] rounded-panel border border-border bg-white p-0 text-navy backdrop:bg-navy/40"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-danger">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <h2 id="delete-dialog-title" className="text-compact font-medium text-navy">
                  Delete this {recordType}?
                </h2>
                <p className="text-caption text-slate">
                  <span className="font-medium text-navy">{recordName}</span> would be removed.
                  {consequence ? ` ${consequence}` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input text-slate hover:bg-subtle"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="delete-confirm-input" className="text-caption font-medium text-navy">
              Type the {recordType} name to confirm
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={recordName}
              className="w-full rounded-input border border-control bg-white px-3 py-2.5 text-compact text-navy placeholder:text-slate focus-visible:border-action"
            />
          </div>

          <p className="rounded-card border border-border bg-subtle px-3 py-2 text-caption text-slate">
            <strong className="font-semibold text-navy">Deletion is not available.</strong> No
            authorized delete mutation exists, and there is no authentication to authorize one or
            to write the audit event a destructive action requires. This dialog is the approved
            design, not a working control.
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center justify-center rounded-input border border-control bg-white px-4 text-compact font-medium text-navy hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              aria-disabled
              title="Deletion requires an authorized mutation and an audit record, neither of which exists yet"
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-1.5 rounded-input bg-danger/40 px-4 text-compact font-medium text-white"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {matches ? "Delete (unavailable)" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
