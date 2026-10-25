"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { FilterPanel } from "@/components/directory/filter-panel";
import { Button } from "@/components/ui/button";
import type { CityOption } from "@/lib/directory/filters";
import { buildDirectoryHref, EMPTY_FILTERS } from "@/lib/directory/query-params";
import type { DirectoryFilters } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

interface MobileFilterDrawerProps {
  filters: DirectoryFilters;
  /** Every city present in the data, each tagged with its country. */
  allCityOptions: CityOption[];
  resultCount: number;
}

/**
 * Mobile/tablet filters in a slide-over sheet (DESIGN.md section 4:
 * "full-screen filter sheet on mobile").
 *
 * Changes are staged in local state and committed on "Apply filters", so a
 * phone user is not navigated on every tap. The staged copy is re-seeded
 * from the committed URL filters whenever the drawer opens, which is what
 * makes selections survive closing and reopening it.
 *
 * Accessibility: `role="dialog"` + `aria-modal`, Escape closes, focus moves
 * into the panel on open and returns to the trigger on close, and the page
 * behind is scroll-locked — the same pattern as the existing
 * `MobileNavigation` sheet, so there is one drawer behaviour in the app.
 */
export function MobileFilterDrawer({ filters, allCityOptions, resultCount }: MobileFilterDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DirectoryFilters>(filters);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // City options follow the *staged* country selection while the drawer is
  // open, so the two controls stay coherent before anything is committed.
  const draftCityOptions = React.useMemo(
    () =>
      draft.countries.length
        ? allCityOptions.filter((option) => draft.countries.includes(option.countryCode))
        : allCityOptions,
    [draft.countries, allCityOptions],
  );

  function openDrawer() {
    setDraft(filters);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  React.useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const activeCount =
    draft.countries.length +
    draft.cities.length +
    draft.jurisdictions.length +
    draft.services.length +
    draft.languages.length +
    (draft.mode === "either" ? 0 : 1);

  const committedCount =
    filters.countries.length +
    filters.cities.length +
    filters.jurisdictions.length +
    filters.services.length +
    filters.languages.length +
    (filters.mode === "either" ? 0 : 1);

  function applyDraft() {
    setOpen(false);
    triggerRef.current?.focus();
    router.push(buildDirectoryHref(filters, { ...draft, page: 1 }), { scroll: false });
  }

  function clearDraft() {
    setDraft({ ...EMPTY_FILTERS, q: draft.q, sort: draft.sort });
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={openDrawer}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-input border border-border bg-white text-compact font-semibold text-navy transition-colors duration-150 hover:border-action hover:bg-tint sm:w-auto sm:px-5"
      >
        <SlidersHorizontal className="h-4 w-4 text-action" aria-hidden />
        Filters
        {committedCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-action px-1.5 text-caption font-semibold text-white">
            {committedCount}
          </span>
        ) : null}
      </button>

      <div
        aria-hidden={!open}
        onClick={closeDrawer}
        className={cn(
          "fixed inset-0 z-40 bg-navy/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label="Directory filters"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-white shadow-[0_0_60px_-10px_rgba(16,44,87,0.5)] transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-compact font-semibold text-navy">Filters</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-input text-navy transition-colors duration-150 hover:bg-tint"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {open ? (
            <FilterPanel
              filters={draft}
              cityOptions={draftCityOptions}
              idPrefix="mobile"
              onChange={(patch) => setDraft((current) => ({ ...current, ...patch, page: 1 }))}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <Button type="button" variant="outline" className="flex-1" onClick={clearDraft}>
            Clear all
          </Button>
          <Button type="button" className="flex-1" onClick={applyDraft}>
            Apply filters
          </Button>
        </div>

        <p className="sr-only" aria-live="polite">
          {activeCount} filters selected. {resultCount} professionals currently shown.
        </p>
      </div>
    </div>
  );
}
