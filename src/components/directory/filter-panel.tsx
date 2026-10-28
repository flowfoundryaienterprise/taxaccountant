"use client";

import * as React from "react";
import { ChevronDown, Info } from "lucide-react";

import {
  consultationModeOptions,
  countryOptions,
  credentialOptions,
  jurisdictionOptions,
  languageOptions,
  serviceOptions,
} from "@/lib/directory/taxonomy";
import { toggleValue } from "@/lib/directory/query-params";
import type { CityOption } from "@/lib/directory/filters";
import type { ConsultationMode, DirectoryFilters } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The filter controls themselves, with no opinion about when a change is
 * committed. The desktop sidebar applies each change immediately; the mobile
 * drawer stages changes locally and commits on "Apply filters". Both render
 * this one component so the two can never drift (brief section 6: "Preserve
 * existing filter selections when the drawer is reopened").
 *
 * Sections are native `<details>`/`<summary>` elements: collapsible,
 * keyboard-operable and screen-reader correct without custom ARIA.
 */

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  selectedCount?: number;
  children: React.ReactNode;
  note?: string;
}

function FilterSection({
  title,
  defaultOpen = false,
  selectedCount = 0,
  children,
  note,
}: FilterSectionProps) {
  /*
   * Day 9: the options were a bare list of checkboxes inside the
   * disclosure, so a screen reader tabbing between them announced only
   * "Singapore, checkbox" — and "Singapore" is an option in *both* the
   * Country group and the City group of the current data, which made the
   * two indistinguishable by ear. Country, city and tax jurisdiction being
   * separate axes is a correctness requirement for this directory, so the
   * grouping has to be conveyed, not just drawn.
   *
   * `role="group"` named by the summary text gives each option its axis.
   * A `<fieldset>`/`<legend>` would be the other way, but the legend has to
   * be the first child of the fieldset, which this disclosure layout (the
   * summary is the heading *and* the toggle) cannot satisfy without
   * restructuring the section.
   */
  const titleId = React.useId();

  return (
    <details
      open={defaultOpen}
      className="group border-b border-border py-4 last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-input text-compact font-semibold text-navy">
        <span className="flex items-center gap-2" id={titleId}>
          {title}
          {selectedCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-action px-1.5 text-caption font-semibold text-white">
              {selectedCount}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate transition-transform duration-150 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      {note ? (
        <p className="mt-2 flex gap-1.5 text-caption text-slate">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>{note}</span>
        </p>
      ) : null}

      <div role="group" aria-labelledby={titleId} className="mt-3 flex flex-col gap-2">
        {children}
      </div>
    </details>
  );
}

interface CheckOptionProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function CheckOption({ id, name, label, hint, checked, disabled, onChange }: CheckOptionProps) {
  // The whole row is the label, so the tap target spans the panel width
  // rather than just the 16px box (DESIGN.md section 10).
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 py-1 text-compact leading-snug text-slate transition-colors duration-150 hover:text-navy",
        checked && "font-medium text-navy",
        disabled && "cursor-not-allowed opacity-60 hover:text-slate",
      )}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-action disabled:cursor-not-allowed"
      />
      <span>
        {label}
        {hint ? <span className="block text-caption text-slate/80">{hint}</span> : null}
      </span>
    </label>
  );
}

/** A capped, scrollable list so a long vocabulary cannot run off the panel. */
function ScrollList({ children, cap }: { children: React.ReactNode; cap?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        cap && "max-h-56 overflow-y-auto pr-1",
      )}
    >
      {children}
    </div>
  );
}

export interface FilterPanelProps {
  filters: DirectoryFilters;
  cityOptions: CityOption[];
  /** `idPrefix` keeps the sidebar and the drawer from sharing input ids. */
  idPrefix: string;
  onChange: (patch: Partial<DirectoryFilters>) => void;
}

export function FilterPanel({ filters, cityOptions, idPrefix, onChange }: FilterPanelProps) {
  const modeName = `${idPrefix}-mode`;

  return (
    <div className="flex flex-col">
      <FilterSection
        title="Country"
        defaultOpen
        selectedCount={filters.countries.length}
        note="Where the professional is based."
      >
        <ScrollList cap>
          {countryOptions.map((option) => (
            <CheckOption
              key={option.value}
              id={`${idPrefix}-country-${option.value}`}
              name="country"
              label={option.label}
              checked={filters.countries.includes(option.value)}
              onChange={() =>
                onChange({
                  countries: toggleValue(filters.countries, option.value),
                  // Selected cities may no longer exist in the new country
                  // scope, so drop city rather than silently return zero rows.
                  cities: [],
                })
              }
            />
          ))}
        </ScrollList>
      </FilterSection>

      {cityOptions.length > 1 ? (
        <FilterSection
          title="City"
          defaultOpen
          selectedCount={filters.cities.length}
          note="Cities shown are the ones present in the current listing data."
        >
          <ScrollList cap>
            {cityOptions.map((option) => (
              <CheckOption
                key={option.value}
                id={`${idPrefix}-city-${option.value}`}
                name="city"
                label={option.label}
                checked={filters.cities.includes(option.value)}
                onChange={() => onChange({ cities: toggleValue(filters.cities, option.value) })}
              />
            ))}
          </ScrollList>
        </FilterSection>
      ) : null}

      <FilterSection
        title="Tax jurisdiction"
        defaultOpen
        selectedCount={filters.jurisdictions.length}
        note="Separate from country. Being based in one country does not authorize advising on another jurisdiction."
      >
        <ScrollList cap>
          {jurisdictionOptions.map((option) => (
            <CheckOption
              key={option.value}
              id={`${idPrefix}-jurisdiction-${option.value}`}
              name="jurisdiction"
              label={option.label}
              checked={filters.jurisdictions.includes(option.value)}
              onChange={() =>
                onChange({ jurisdictions: toggleValue(filters.jurisdictions, option.value) })
              }
            />
          ))}
        </ScrollList>
      </FilterSection>

      <FilterSection
        title="Service"
        defaultOpen
        selectedCount={filters.services.length}
      >
        <ScrollList>
          {serviceOptions.map((option) => (
            <CheckOption
              key={option.value}
              id={`${idPrefix}-service-${option.value}`}
              name="service"
              label={option.label}
              checked={filters.services.includes(option.value)}
              onChange={() => onChange({ services: toggleValue(filters.services, option.value) })}
            />
          ))}
        </ScrollList>
      </FilterSection>

      <FilterSection
        title="Language"
        selectedCount={filters.languages.length}
      >
        <ScrollList cap>
          {languageOptions.map((option) => (
            <CheckOption
              key={option.value}
              id={`${idPrefix}-language-${option.value}`}
              name="language"
              label={option.label}
              checked={filters.languages.includes(option.value)}
              onChange={() => onChange({ languages: toggleValue(filters.languages, option.value) })}
            />
          ))}
        </ScrollList>
      </FilterSection>

      <FilterSection
        title="Consultation"
        defaultOpen
        selectedCount={filters.mode === "either" ? 0 : 1}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Consultation mode</legend>
          {consultationModeOptions.map((option) => (
            <label
              key={option.value}
              htmlFor={`${idPrefix}-mode-${option.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 py-1 text-compact text-slate transition-colors duration-150 hover:text-navy",
                filters.mode === option.value && "font-medium text-navy",
              )}
            >
              <input
                id={`${idPrefix}-mode-${option.value}`}
                name={modeName}
                type="radio"
                checked={filters.mode === option.value}
                onChange={() => onChange({ mode: option.value as ConsultationMode })}
                className="h-4 w-4 shrink-0 cursor-pointer accent-action"
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      </FilterSection>

      {/*
        Built, labelled and deliberately inert: every designation in the
        current data carries `publicDisplayStatus: "unverified"`, and offering
        a designation filter would imply the platform had reviewed them
        (DESIGN.md section 11). It turns on with credential review records.
      */}
      <FilterSection
        title="Professional designation"
        note="Not available yet — designations in this listing are self-declared and have not been through credential review."
      >
        <ScrollList>
          {credentialOptions.map((option) => (
            <CheckOption
              key={option.value}
              id={`${idPrefix}-credential-${option.value}`}
              name="credential"
              label={option.label}
              checked={false}
              disabled
              onChange={() => {}}
            />
          ))}
        </ScrollList>
      </FilterSection>

      <p className="flex gap-1.5 border-t border-border pt-4 text-caption text-slate">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span>
          Price, rating and availability filters are not offered. Those attributes have no approved
          data source yet, so filtering on them would return invented results.
        </span>
      </p>
    </div>
  );
}
