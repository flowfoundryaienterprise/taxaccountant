import { CalendarOff, Globe2, Languages, MapPin, Users } from "lucide-react";

import { countryLabel } from "@/lib/directory/taxonomy";
import {
  consultationLabel,
  detailedLocationLine,
  languageLabels,
  primaryLocation,
} from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";

/**
 * Languages and consultation preferences.
 *
 * Preferences, not availability. `professionals.remoteServices` and the
 * optional `inPersonServices` say how this professional works; they say
 * nothing about when. No working hours, no appointment slots and no
 * real-time status are shown, because the platform holds none
 * (`availabilitySlots` and `appointments` are Phase 3 collections) and the
 * Day 5 brief forbids inventing them. The closing note states that plainly
 * rather than leaving the absence to be guessed at.
 *
 * Timezone is likewise absent: `professionals` carries no timezone field in
 * the approved Phase 1 model, so there is nothing to render.
 */
export function LanguagesSection({ profile }: { profile: ProfessionalProfile }) {
  const languages = languageLabels(profile.languageCodes);
  const location = primaryLocation(profile);

  return (
    <section id="languages" className="flex flex-col gap-5">
      <h2 className="text-heading-lg font-semibold text-navy">
        Languages &amp; consultation preferences
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-input bg-tint text-action">
              <Languages className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-compact font-semibold text-navy">Languages</h3>
          </div>

          {languages.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {languages.map((language) => (
                <li
                  key={language}
                  className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy"
                >
                  {language}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-slate">No languages are listed on this profile.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-input bg-tint text-action">
              <Globe2 className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-compact font-semibold text-navy">Consultation</h3>
          </div>

          <p className="text-compact text-navy">{consultationLabel(profile)}</p>

          <ul className="flex flex-col gap-1.5 text-caption text-slate">
            <li className="flex items-start gap-1.5">
              <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
              <span>
                Remote consultations:{" "}
                <span className="font-medium text-navy">
                  {profile.remoteServices ? "offered" : "not offered"}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
              <span>
                In-person consultations:{" "}
                <span className="font-medium text-navy">
                  {profile.inPersonServices === undefined
                    ? "not stated"
                    : profile.inPersonServices
                      ? "offered"
                      : "not offered"}
                </span>
              </span>
            </li>
            {location ? (
              <li className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
                <span className="min-w-0 break-words">
                  Based in{" "}
                  <span className="font-medium text-navy">
                    {location.publicLocationText ?? detailedLocationLine(location)}
                  </span>
                  <span className="sr-only"> ({countryLabel(location.countryCode)})</span>
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className="flex max-w-[80ch] items-start gap-2 rounded-card border border-border bg-tint/60 px-4 py-3 text-caption text-slate">
        <CalendarOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
        <span>
          No working hours, appointment times or real-time availability are shown anywhere on this
          page. The platform holds none of that data — scheduling and calendar features are a later
          phase — so arrange timing directly with any professional you contact.
        </span>
      </p>
    </section>
  );
}
