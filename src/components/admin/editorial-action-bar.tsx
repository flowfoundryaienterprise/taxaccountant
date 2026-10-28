"use client";

import { Info, Lock } from "lucide-react";

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
  /** Flips to `true` only when an authorized, permission-checked backend exists. */
  backendReady?: boolean;
  /** Rendered alongside the workflow actions — usually Cancel. */
  children?: React.ReactNode;
}

/**
 * The Draft → Review → Publish → Unpublish control set.
 *
 * ## Every control is disabled, and says which reason applies
 * Two different reasons can block an action, and they are not
 * interchangeable:
 *
 *  - a **validation blocker** ("this article has no recorded review") is
 *    actionable by the editor, so it is shown in preference; and
 *  - the **missing backend** reason, which is not actionable by anyone
 *    using this screen.
 *
 * `transitionAvailability` decides between them. Nothing here fakes a save:
 * there is no success path in this component at all, so there is nothing
 * that could accidentally report one.
 *
 * ## Only legal transitions appear
 * The bar renders `transitionsFrom(status)`, so a draft never offers
 * "Unpublish" and a published record never offers "Submit for review". The
 * server must still enforce the same rules — a disabled button is a UI
 * affordance, not a permission check.
 */
export function EditorialActionBar({
  status,
  blockers = {},
  backendReady = false,
  children,
}: EditorialActionBarProps) {
  const actions = transitionAvailability({ status, backendReady, blockers });

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-compact font-semibold text-navy">Editorial workflow</h2>
        <p className="text-caption text-slate">
          Current state: <span className="font-medium text-navy">{statusLabel(status)}</span>.{" "}
          {statusVisibility(status)}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {actions.map((action) => (
          <li key={action.action} className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled={!action.enabled}
              aria-disabled={!action.enabled}
              title={action.blockedReason}
              aria-describedby={action.blockedReason ? `${action.action}-reason` : undefined}
              className={cn(
                "inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-input px-4 text-compact font-medium transition-colors duration-150",
                action.enabled
                  ? action.destructive
                    ? "bg-action text-white hover:bg-[#0668c7]"
                    : "border border-control bg-white text-navy hover:bg-tint"
                  : "cursor-not-allowed border border-border bg-tint/50 text-slate",
              )}
            >
              {!action.enabled ? <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
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

            {/* Naming the mutation makes the pending contract concrete for
                whoever writes the backend, rather than leaving it implied. */}
            <p className="text-caption text-slate/70">
              Will call <code className="font-mono">{action.mutation}</code>
            </p>
          </li>
        ))}
      </ul>

      {children}
    </div>
  );
}
