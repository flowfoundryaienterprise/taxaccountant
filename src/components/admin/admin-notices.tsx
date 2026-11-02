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
        "flex max-w-[92ch] gap-2 rounded-[1rem] border px-4 py-3 text-caption",
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
        "flex max-w-[92ch] gap-2 rounded-[1rem] border border-border bg-subtle px-4 py-3 text-caption text-slate",
        className,
      )}
    >
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
      <span>
        <strong className="font-semibold text-navy">Read-only interface.</strong> Save, publish and
        delete are disabled throughout this CMS. Staff sign-in is enforced server-side, but no
        `cms:*` Convex mutation exists yet for it to authorize — so these controls are inert rather
        than pretending to persist. The forms still validate, so the rules can be reviewed before
        the backend is written.
      </span>
    </p>
  );
}

/**
 * The status banner on the CMS overview.
 *
 * States the actual posture rather than implying more or less than is
 * true. Sign-in and the staff role check are real — `/admin/layout.tsx`
 * verifies the session and an active `staffMemberships` row server-side on
 * every request (`convex/staff.ts`) before any admin screen renders.
 *
 * Pages and Articles (`convex/content.ts`) are the first two collections
 * with a real save/review/publish/delete workflow; Messages
 * (`convex/contact.ts`) reads and updates real submissions. Everything
 * else — Services, Countries, Jurisdictions, Professionals, Media,
 * Settings, SEO — is still read-only: each screen's own `ReadOnlyNotice`
 * says so.
 */
export function CmsStatusNotice() {
  return (
    <div className="flex gap-3 rounded-[1.25rem] border border-border bg-white px-5 py-5">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-compact font-medium text-navy">Staff sign-in required</h2>
        <p className="max-w-[92ch] text-caption text-slate">
          This screen is only reachable after a server-verified Better Auth session with an active
          staff role — anonymous and non-staff requests are redirected to{" "}
          <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">/staff-login</code>{" "}
          before any admin markup renders. Pages, Articles and Messages save, publish and delete
          for real now. The remaining screens (Services, Countries, Jurisdictions, Professionals,
          Media, Settings, SEO) are still read-only previews — each says so on its own screen.
        </p>
      </div>
    </div>
  );
}
