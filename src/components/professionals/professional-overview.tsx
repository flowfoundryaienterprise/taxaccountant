import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { profileName } from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";

/**
 * "About [name]" — `professionals.bio`, rendered as paragraphs.
 *
 * When no biography has been supplied and approved, the section says so
 * instead of generating one. Day 5 brief section 5: years of experience,
 * certifications, client counts, awards, previous employers and professional
 * memberships are never fabricated, and the model carries no field for any
 * of them, so there is nothing here to fill in.
 */
export function ProfessionalOverview({ profile }: { profile: ProfessionalProfile }) {
  const name = profileName(profile);

  return (
    <section id="about" className="flex flex-col gap-5">
      <h2 className="text-heading-lg font-semibold text-navy">About {name}</h2>

      {profile.bio.length ? (
        <div className="flex max-w-[72ch] flex-col gap-4">
          {profile.bio.map((paragraph, index) => (
            <p key={index} className="text-body text-slate">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No profile summary has been supplied yet"
          description={`${name} has not provided a written overview for publication. Rather than generate one, this section stays empty — the services, tax jurisdictions and languages below are the facts held on this listing.`}
        />
      )}
    </section>
  );
}
