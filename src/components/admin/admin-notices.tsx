import { FlaskConical, Lock, ShieldAlert } from "lucide-react";

import type { DataProvenance } from "@/lib/admin/admin-types";
import { cn } from "@/lib/utils";

/**
 * The three honesty notices every CMS screen is built around.
 *
 * They are load-bearing, not decoration. This interface has no
 * authentication, performs no writes, and shows a mixture of approved and
 * demonstration data — a reader must be able to tell which at a glance, on
 * every screen, without reading the source.
 */

/**
 * Says where the rows on this screen came from.
 *
 * `approved` — projected from the modules the public site already renders,
 * so what is shown is what is live. `demonstration` — a Day 6 fixture that
 * exists only to exercise the UI, because the underlying collection holds
 * no rows and nothing has been authored.
 */
export function ProvenanceNotice({
  provenance,
  entity,
  detail,
}: {
  provenance: DataProvenance;
  entity: string;
  detail?: string;
}) {
  const approved = provenance === "approved";

  return (
    <p
      className={cn(
        "flex max-w-[92ch] gap-2 rounded-card border px-4 py-3 text-caption",
        approved ? "border-border bg-white text-slate" : "border-warning/30 bg-white text-slate",
      )}
    >
      <FlaskConical
        className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", approved ? "text-action" : "text-warning")}
        aria-hidden
      />
      <span>
        <strong className="font-semibold text-navy">
          {approved ? "Live content." : "Demonstration content."}
        </strong>{" "}
        {approved
          ? `These ${entity} are read from the same modules the public site renders, so this screen shows exactly what is live today.`
          : `No ${entity} have been authored — the underlying collection holds no rows — so this screen is populated with clearly-labelled development fixtures to exercise the interface.`}
        {detail ? ` ${detail}` : ""}
      </span>
    </p>
  );
}

/**
 * The standing explanation for why nothing can be saved.
 *
 * Rendered on every screen that shows an editable-looking form or a
 * destructive-looking action. Buttons that cannot persist are disabled, and
 * this is where the reason lives, so a disabled control is never
 * unexplained (Day 6 brief section 18).
 */
export function ReadOnlyNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex max-w-[92ch] gap-2 rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate",
        className,
      )}
    >
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
      <span>
        <strong className="font-semibold text-navy">Read-only interface.</strong> Save, publish and
        delete are disabled throughout this CMS. No authorized Convex mutation exists yet, and no
        authentication is in place to authorize one — so these controls are inert rather than
        pretending to persist. The forms still validate, so the rules can be reviewed before the
        backend is written.
      </span>
    </p>
  );
}

/**
 * The security banner on the CMS overview.
 *
 * States the actual posture rather than implying the interface is
 * protected: there is no authentication at all, and the only thing keeping
 * these screens off the public internet is that they are stripped from
 * production builds.
 */
export function UnauthenticatedNotice() {
  return (
    <div className="flex gap-3 rounded-card border border-warning/40 bg-white px-4 py-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-compact font-semibold text-navy">
          This CMS has no authentication and is not deployed
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          No sign-in, session or role check exists anywhere in this project yet. These screens are
          excluded from production builds at compile time by the{" "}
          <code className="rounded bg-tint px-1 py-0.5 font-mono text-navy">
            cms-production-exclusion
          </code>{" "}
          plugin, so no CMS code or data reaches a deployed environment and{" "}
          <code className="rounded bg-tint px-1 py-0.5 font-mono text-navy">/admin</code> returns
          404 there. That is a build gate, not authorization: before this interface may be enabled
          anywhere, it needs server-side authentication, staff role checks, and authorized Convex
          queries that enforce the public/private boundary on the server.
        </p>
      </div>
    </div>
  );
}
