import { BadgeCheck, GraduationCap, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { jurisdictionLabel } from "@/lib/directory/taxonomy";
import {
  credentialStatusLabel,
  isGenuinelyVerified,
  profileName,
} from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";
import { cn } from "@/lib/utils";

/**
 * Qualifications and credentials.
 *
 * ## The verification rule, implemented rather than described
 * A verified badge is rendered only when `isGenuinelyVerified` is true, and
 * that helper requires *two* things on the row: `publicDisplayStatus ===
 * "verified"` **and** a `reviewedAt` timestamp, which only a completed
 * documentary review writes. A fixture, a seed script or a mistakenly
 * flipped enum therefore cannot produce a badge on its own — exactly the
 * failure the Day 5 brief section 8 warns about, and DATABASE.md section 2's
 * "production verified requires documentary review record".
 *
 * Everything currently in the data is `unverified`, so every row here renders
 * the factual "not yet verified by the marketplace" status instead.
 *
 * Expiry and renewal dates are not shown: `professionalPublicCredentials`
 * holds no expiry field in Phase 1 (`credentialSubmissions.expiryAt` is a
 * Phase 2 collection), so there is nothing to display and nothing may be
 * invented. Licence numbers and credential documents are never rendered —
 * they are private source material, not approved publication data.
 */
export function CredentialsSection({ profile }: { profile: ProfessionalProfile }) {
  const name = profileName(profile);

  return (
    <section id="credentials" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-lg font-semibold text-navy">Qualifications &amp; credentials</h2>
        <p className="max-w-[72ch] text-compact text-slate">
          Designations {name} states for this listing, with the review status of each.
        </p>
      </div>

      {profile.credentials.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No credentials are listed on this profile"
          description="Nothing has been supplied for publication, so nothing is shown. Ask any professional directly about their qualifications and about authorization for the jurisdiction you need."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {profile.credentials.map((credential, index) => {
            const verified = isGenuinelyVerified(credential);

            return (
              <li
                key={`${credential.designation}-${index}`}
                className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-tint text-action">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </span>

                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="min-w-0 break-words text-compact font-semibold text-navy">
                      {credential.designation}
                    </p>

                    {credential.issuer ? (
                      <p className="min-w-0 break-words text-caption text-slate">
                        Issued by {credential.issuer}
                      </p>
                    ) : (
                      <p className="text-caption text-slate">
                        Issuing organization not supplied for publication
                      </p>
                    )}

                    {credential.jurisdictionCode ? (
                      <p className="min-w-0 break-words text-caption text-slate">
                        Applies to {jurisdictionLabel(credential.jurisdictionCode)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1 text-caption font-medium",
                    verified
                      ? "border-success/30 bg-white text-success"
                      : "border-border bg-tint/70 text-slate",
                  )}
                >
                  {verified ? (
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {credentialStatusLabel(credential)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="max-w-[80ch] rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate">
        <strong className="font-semibold text-navy">How to read this section.</strong> Designations
        shown here are self-declared. TaxAccountant.com has not reviewed any supporting document
        for this profile, so no credential carries a verified badge. Credential review is a later
        phase of this platform; until a documented review is completed and approved, this page will
        keep saying so rather than implying otherwise. Licence numbers, certificates and other
        credential documents are never published here.
      </p>
    </section>
  );
}
