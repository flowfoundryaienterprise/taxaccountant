import Link from "next/link";
import { ArrowRight, Building2, Info, MapPin, Scale } from "lucide-react";

import { CountryBadge } from "@/components/countries/country-badge";
import { countryLabel, jurisdictionOptions } from "@/lib/directory/taxonomy";
import { countryHref, directoryHref } from "@/lib/marketplace/query-params";
import {
  detailedLocationLine,
  jurisdictionCodes,
  profileName,
} from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";

const jurisdictionByCode = new Map(jurisdictionOptions.map((option) => [option.value, option]));

/**
 * Countries & tax jurisdictions served.
 *
 * The one section where the distinction this whole product depends on is
 * stated outright, in three separately labelled blocks:
 *
 *  1. **Practice location** — where the professional or firm is based
 *     (`professionalLocations`).
 *  2. **Tax jurisdiction** — the authorities their listed services cover
 *     (`professionalServices.taxJurisdictionId`), which is a different fact
 *     and frequently a different country.
 *  3. **Authorization** — who grants it, and the plain statement that this
 *     marketplace has not reviewed it.
 *
 * DATABASE.md section 2: "country location and authorization must remain
 * distinct"; the Day 5 brief: "Do not assume a professional licensed in one
 * jurisdiction can offer regulated services in every other jurisdiction."
 */
export function JurisdictionCoverage({ profile }: { profile: ProfessionalProfile }) {
  const name = profileName(profile);
  const codes = jurisdictionCodes(profile);

  // Group jurisdictions under the country that administers them, so a reader
  // sees "United States — Federal (IRS), New York State (DTF)" rather than a
  // flat list that reads like one blanket permission.
  const grouped = new Map<string, string[]>();
  for (const code of codes) {
    const option = jurisdictionByCode.get(code);
    const country = option?.countryCode ?? "—";
    const bucket = grouped.get(country);
    if (bucket) bucket.push(code);
    else grouped.set(country, [code]);
  }

  return (
    <section id="jurisdictions" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-lg font-semibold text-navy">
          Countries &amp; tax jurisdictions served
        </h2>
        <p className="max-w-[72ch] text-compact text-slate">
          Where {name} is based and which tax authorities their listed services cover are two
          separate facts. They are shown separately here because one does not follow from the
          other.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-input bg-tint text-action">
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-compact font-semibold text-navy">Practice location</h3>
          </div>

          <p className="text-caption text-slate">
            Where {profile.kind === "firm" ? "the firm operates" : "this professional works"}{" "}
            from. It describes geography, nothing more.
          </p>

          <ul className="flex flex-col gap-3">
            {profile.locations.map((location, index) => (
              <li
                key={`${location.countryCode}-${location.city}-${index}`}
                className="flex min-w-0 items-start gap-3"
              >
                <CountryBadge
                  code={location.countryCode}
                  countryName={countryLabel(location.countryCode)}
                  size="sm"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="min-w-0 break-words text-compact font-medium text-navy">
                    {detailedLocationLine(location)}
                  </p>
                  <p className="text-caption text-slate">
                    {location.isPrimary ? "Primary location" : "Additional location"}
                    {location.publicLocationText ? ` · ${location.publicLocationText}` : ""}
                  </p>
                  <Link
                    href={countryHref(location.countryCode)}
                    className="w-fit text-caption font-semibold text-action hover:underline"
                  >
                    About {countryLabel(location.countryCode)}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-input bg-tint text-action">
              <Scale className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="text-compact font-semibold text-navy">Tax jurisdictions</h3>
          </div>

          <p className="text-caption text-slate">
            The authorities this profile&rsquo;s listed services relate to. Several of these may
            sit outside the practice location above.
          </p>

          {codes.length === 0 ? (
            <p className="rounded-input bg-tint/70 px-3 py-2 text-caption text-slate">
              No tax jurisdictions are listed on this profile.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {[...grouped.entries()].map(([country, jurisdictions]) => (
                <li key={country} className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {country === "—" ? null : (
                      <CountryBadge
                        code={country}
                        countryName={countryLabel(country)}
                        size="sm"
                      />
                    )}
                    <p className="min-w-0 break-words text-compact font-medium text-navy">
                      {country === "—" ? "Other" : countryLabel(country)}
                    </p>
                  </div>

                  <ul className="flex flex-wrap gap-1.5">
                    {jurisdictions.map((code) => (
                      <li key={code}>
                        <Link
                          href={directoryHref({ jurisdiction: code })}
                          className="inline-block rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy transition-colors duration-150 hover:bg-[#dcecff]"
                        >
                          {jurisdictionByCode.get(code)?.label ?? code}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-card border border-border bg-tint/60 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-white text-action">
          <Building2 className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="text-compact font-semibold text-navy">Authorization</h3>
          <p className="max-w-[80ch] text-caption text-slate">
            Permission to provide regulated tax services is granted by each jurisdiction under its
            own rules — never by this marketplace, and never by being listed here. The
            jurisdictions above are what this profile states, not what TaxAccountant.com has
            confirmed: no authorization check has been carried out for {name}. Being authorized in
            one jurisdiction implies nothing about any other. Confirm authorization for the
            jurisdiction you actually file in, directly with the professional, before engaging
            anyone.
          </p>
          <p className="flex items-start gap-1.5 text-caption text-slate">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
            <span>
              The directory filters country and tax jurisdiction separately for the same reason.
            </span>
          </p>
          <Link
            href={directoryHref()}
            className="group inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-action"
          >
            Search by tax jurisdiction
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
