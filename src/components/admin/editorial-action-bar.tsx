"use client";

import * as React from "react";
import { Info, Loader2, Lock } from "lucide-react";

import {
  statusLabel,
  statusVisibility,
  transitionAvailability,
  type EditorialAction,
  type EditorialStatus,
} from "@/lib/cms/content-status";
import { cn } from "@/lib/utils";

interface EditorialActionBarProps {
  status: EditorialStatus;
  /** Blocking problems keyed by action, from `content-validation`. */
  blockers?: Partial<Record<EditorialAction, string>>;
  /**
   * `false` only for an unsaved new record — there's nothing to transition
   * yet. `true` once a record exists, since every `content:*` mutation this
   * bar calls is real (`convex/content.ts`).
   */
  backendReady?: boolean;
  /** Performs the transition. Throwing surfaces the message as the error. */
  onAction?: (action: EditorialAction) => Promise<void>;
  /** Rendered alongside the workflow actions — usually Cancel. */
  children?: React.ReactNode;
}

/**
 * The Draft → Review → Publish → Unpublish control set.
 *
 * ## Every control says which reason blocks it
 * Two different reasons can block an action, and they are not
 * interchangeable:
 *
 *  - a **validation blocker** ("this article has no recorded review") is
 *    actionable by the editor, so it is shown in preference; and
 *  - **no record saved yet** (`backendReady=false`), which isn't actionable
 *    until the draft exists.
 *
 * `transitionAvailability` decides between them.
 *
 * ## Only legal transitions appear
 * The bar renders `transitionsFrom(status)`, so a draft never offers
 * "Unpublish" and a published record never offers "Submit for review". The
 * server enforces the same rules independently (`convex/content.ts`) — this
 * is a UI affordance, not the permission check.
 */
export function EditorialActionBar({
  status,
  blockers = {},
  backendReady = true,
  onAction,
  children,
}: EditorialActionBarProps) {
  const actions = transitionAvailability({ status, backendReady, blockers });
  const [pending, setPending] = React.useState<EditorialAction | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick(action: EditorialAction) {
    if (!onAction) return;
    setPending(action);
    setError(null);
    try {
      await onAction(action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-compact font-medium text-navy">Editorial workflow</h2>
        <p className="text-caption text-slate">
          Current state: <span className="font-medium text-navy">{statusLabel(status)}</span>.{" "}
          {statusVisibility(status)}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {actions.map((action) => {
          const isPending = pending === action.action;
          const disabled = !action.enabled || pending !== null;

          return (
            <li key={action.action} className="flex flex-col gap-1.5">
              <button
                type="button"
                disabled={disabled}
                aria-disabled={disabled}
                title={action.blockedReason}
                aria-describedby={action.blockedReason ? `${action.action}-reason` : undefined}
                onClick={() => handleClick(action.action)}
                className={cn(
                  "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-input px-4 text-compact font-medium transition-[background-color,transform] duration-150 active:scale-[0.98]",
                  action.enabled
                    ? action.destructive
                      ? "bg-action text-white hover:bg-[#0668c7] disabled:opacity-70"
                      : "border border-control bg-white text-navy hover:bg-subtle disabled:opacity-70"
                    : "cursor-not-allowed border border-border bg-subtle text-slate",
                )}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                ) : !action.enabled ? (
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : null}
                {action.label}
              </button>

              <p className="text-caption text-slate">{action.description}</p>

              {action.blockedReason ? (
                <p
                  id={`${action.action}-reason`}
                  className="flex items-start gap-1.5 text-caption text-warning"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{action.blockedReason}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {children}
    </div>
  );
}
