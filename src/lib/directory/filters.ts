import { PAGE_SIZE } from "@/lib/directory/query-params";
import {
  citySlug,
  countryLabel,
  jurisdictionLabel,
  languageLabel,
  serviceLabel,
} from "@/lib/directory/taxonomy";
import type {
  ActiveFilterChip,
  DirectoryFilters,
  DirectoryProfessional,
  DirectoryResults,
} from "@/lib/directory/types";

/**
 * Pure filter/sort/paginate logic over a `DirectoryProfessional[]`.
 *
 * Today the input is the fixture array (`./fixtures`). When
 * `professionals:search` lands (IMPLEMENTATION_PLAN.md Day 9) the server
 * pushes `DirectoryFilters` down as query args and returns a page of rows via
 * the cursor contract instead — the components consume `DirectoryResults`
 * either way, so only the page shell changes. These helpers are deliberately
 * side-effect free and framework free.
 */

function matchesKeyword(professional: DirectoryProfessional, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    professional.displayName,
    professional.firmName ?? "",
    professional.city,
    countryLabel(professional.countryCode),
    ...professional.credentials.map((credential) => credential.designation),
    ...professional.serviceSlugs.map(serviceLabel),
    ...professional.jurisdictionCodes.map(jurisdictionLabel),
  ]
    .join(" ")
    .toLowerCase();

  // Every whitespace-separated term must appear somewhere.
  return needle.split(/\s+/).every((term) => haystack.includes(term));
}

const intersects = (values: string[], selected: string[]) =>
  selected.length === 0 || values.some((value) => selected.includes(value));

export function filterProfessionals(
  professionals: DirectoryProfessional[],
  filters: DirectoryFilters,
): DirectoryProfessional[] {
  return professionals.filter((professional) => {
    if (!matchesKeyword(professional, filters.q)) return false;

    if (filters.countries.length && !filters.countries.includes(professional.countryCode)) {
      return false;
    }
    if (filters.cities.length && !filters.cities.includes(citySlug(professional.city))) {
      return false;
    }
    // Jurisdiction is matched on its own axis — never derived from country.
    if (!intersects(professional.jurisdictionCodes, filters.jurisdictions)) return false;
    if (!intersects(professional.serviceSlugs, filters.services)) return false;
    if (!intersects(professional.languageCodes, filters.languages)) return false;

    if (filters.mode === "remote" && !professional.remote) return false;
    if (filters.mode === "in_person" && !professional.inPerson) return false;

    return true;
  });
}

export function sortProfessionals(
  professionals: DirectoryProfessional[],
  sort: DirectoryFilters["sort"],
): DirectoryProfessional[] {
  const sorted = [...professionals];

  switch (sort) {
    case "name-desc":
      return sorted.sort((a, b) => b.displayName.localeCompare(a.displayName));
    case "recent":
      // Stands in for descending Convex `_creationTime`.
      return sorted.sort((a, b) => b.fixtureOrder - a.fixtureOrder);
    case "name-asc":
    default:
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}

export function searchDirectory(
  professionals: DirectoryProfessional[],
  filters: DirectoryFilters,
): DirectoryResults {
  const matched = sortProfessionals(filterProfessionals(professionals, filters), filters.sort);

  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Clamp rather than 404 — a stale `?page=9` link shows the last page.
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: matched.slice(start, start + PAGE_SIZE),
    total,
    page,
    pageCount,
    pageSize: PAGE_SIZE,
  };
}

export interface CityOption {
  value: string;
  label: string;
  countryCode: string;
}

/**
 * City options come from the data itself, never from an invented list —
 * "Do not generate fictional location coverage". Narrowed to the selected
 * countries when any are selected, so the control stays short and truthful.
 */
export function availableCities(
  professionals: DirectoryProfessional[],
  selectedCountries: string[],
): CityOption[] {
  const scope = selectedCountries.length
    ? professionals.filter((professional) => selectedCountries.includes(professional.countryCode))
    : professionals;

  const byToken = new Map<string, CityOption>();
  for (const professional of scope) {
    const value = citySlug(professional.city);
    if (!byToken.has(value)) {
      byToken.set(value, {
        value,
        label: professional.city,
        countryCode: professional.countryCode,
      });
    }
  }

  return [...byToken.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function allCityTokens(professionals: DirectoryProfessional[]): Set<string> {
  return new Set(professionals.map((professional) => citySlug(professional.city)));
}

const MODE_CHIP_LABELS: Record<string, string> = {
  remote: "Remote",
  in_person: "In person",
};

/**
 * Flattens the filter state into individually removable chips. `key` and
 * `value` are enough for the chip row to build a "remove just this one" URL.
 */
export function activeFilterChips(
  filters: DirectoryFilters,
  cityOptions: CityOption[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const cityLabels = new Map(cityOptions.map((option) => [option.value, option.label]));

  if (filters.q) {
    chips.push({ key: "q", value: filters.q, label: `“${filters.q}”`, groupLabel: "Keyword" });
  }
  for (const value of filters.countries) {
    chips.push({ key: "countries", value, label: countryLabel(value), groupLabel: "Country" });
  }
  for (const value of filters.cities) {
    chips.push({
      key: "cities",
      value,
      label: cityLabels.get(value) ?? value,
      groupLabel: "City",
    });
  }
  for (const value of filters.jurisdictions) {
    chips.push({
      key: "jurisdictions",
      value,
      label: jurisdictionLabel(value),
      groupLabel: "Tax jurisdiction",
    });
  }
  for (const value of filters.services) {
    chips.push({ key: "services", value, label: serviceLabel(value), groupLabel: "Service" });
  }
  for (const value of filters.languages) {
    chips.push({ key: "languages", value, label: languageLabel(value), groupLabel: "Language" });
  }
  if (filters.mode !== "either") {
    chips.push({
      key: "mode",
      value: filters.mode,
      label: MODE_CHIP_LABELS[filters.mode] ?? filters.mode,
      groupLabel: "Consultation",
    });
  }

  return chips;
}
