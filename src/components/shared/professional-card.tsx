import Link from "next/link";
import { Globe2, Heart, Languages, MapPin, Scale, Star } from "lucide-react";

import { PortraitImage } from "@/components/shared/portrait-image";
import { cn } from "@/lib/utils";

/**
 * One card for the Day 2 homepage highlights and the Day 3 directory.
 *
 * Everything beyond identity, location and services is optional, and the
 * card renders only what it is given — so a caller with no substantiated
 * rating, price or availability simply omits those fields rather than
 * passing a placeholder (DESIGN.md section 5: ProfessionalCard has "no
 * invented rating/status", section 9: "omit unavailable data rather than
 * generating misleading placeholders"). `DemoProfessional` from
 * `@/lib/home-content` structurally satisfies this model, so the homepage
 * call site is unchanged.
 */
export interface ProfessionalCardModel {
  id: string;
  name: string;
  /** Self-declared designation. Never rendered with a verification mark. */
  designation?: string;
  city: string;
  countryName: string;
  services: string[];
  languages?: string[];
  /** Short tax-jurisdiction labels; distinct from `countryName`. */
  jurisdictions?: string[];
  consultation?: { remote: boolean; inPerson: boolean };
  rating?: number;
  reviewCount?: number;
  rate?: string;
  availability?: string;
  photo?: string;
  photoAlt: string;
}

interface ProfessionalCardProps {
  professional: ProfessionalCardModel;
  /**
   * Where "View Profile" goes. `/professionals/[slug]` is
   * IMPLEMENTATION_PLAN.md Day 10, so callers without a real profile route
   * pass `cta="pending"` instead of linking somewhere that cannot answer.
   */
  profileHref?: string;
  cta?: "link" | "pending";
  /** Favorites are a Phase 2 collection; the directory opts out. */
  saveable?: boolean;
  sizes?: string;
  className?: string;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function MetaRow({
  icon: Icon,
  children,
  label,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <p className="flex items-start gap-1.5 text-compact text-slate">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {label ? <span className="sr-only">{label}: </span> : null}
        {children}
      </span>
    </p>
  );
}

export function ProfessionalCard({
  professional,
  profileHref = "/find-accountant",
  cta = "link",
  saveable = true,
  sizes,
  className,
}: ProfessionalCardProps) {
  const { consultation } = professional;
  const modeLabel =
    consultation?.remote && consultation?.inPerson
      ? "Remote or in person"
      : consultation?.remote
        ? "Remote only"
        : consultation?.inPerson
          ? "In person only"
          : null;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-[0_20px_40px_-28px_rgba(16,44,87,0.25)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_28px_48px_-28px_rgba(16,44,87,0.35)]",
        className,
      )}
    >
      <div className="relative">
        {professional.photo ? (
          <PortraitImage
            src={professional.photo}
            alt={professional.photoAlt}
            sizes={sizes}
            className="relative aspect-[4/5] w-full overflow-hidden bg-tint"
          />
        ) : (
          <div
            role="img"
            aria-label={professional.photoAlt}
            className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-tint via-white to-tint"
          >
            <span
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-heading-sm font-semibold text-white transition-transform duration-300 ease-out group-hover:scale-105"
            >
              {initialsOf(professional.name)}
            </span>
          </div>
        )}

        {saveable ? (
          <button
            type="button"
            aria-label={`Save ${professional.name}`}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate shadow-[0_8px_16px_-8px_rgba(16,44,87,0.4)] transition-colors duration-150 hover:text-danger"
          >
            <Heart className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-compact font-semibold text-navy">{professional.name}</h3>

          {professional.designation ? (
            <p
              className="mt-1 text-caption text-slate"
              title="Self-declared designation — not verified by TaxAccountant.com"
            >
              {professional.designation}
            </p>
          ) : null}

          {professional.rating !== undefined ? (
            <div className="mt-1 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
              <span className="text-caption font-semibold text-navy">{professional.rating}</span>
              {professional.reviewCount !== undefined ? (
                <span className="text-caption text-slate">
                  ({professional.reviewCount} reviews)
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Kept byte-identical to the approved Day 2 markup — only an
            invisible screen-reader label is added. */}
        <p className="flex items-center gap-1.5 text-compact text-slate">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Location: </span>
          {professional.city}, {professional.countryName}
        </p>

        {professional.jurisdictions?.length ? (
          <MetaRow icon={Scale} label="Advises on tax jurisdictions">
            {professional.jurisdictions.join(" · ")}
          </MetaRow>
        ) : null}

        {professional.languages?.length ? (
          <MetaRow icon={Languages} label="Languages">
            {professional.languages.join(", ")}
          </MetaRow>
        ) : null}

        {modeLabel ? (
          <MetaRow icon={Globe2} label="Consultation">
            {modeLabel}
          </MetaRow>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {professional.services.map((service) => (
            <span
              key={service}
              className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy"
            >
              {service}
            </span>
          ))}
        </div>

        {professional.rate || professional.availability ? (
          <div className="flex items-center justify-between pt-1">
            {professional.rate ? (
              <span className="text-compact font-semibold text-navy">{professional.rate}</span>
            ) : null}
            {professional.availability ? (
              <span className="flex items-center gap-1.5 text-caption font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                {professional.availability}
              </span>
            ) : null}
          </div>
        ) : null}

        {cta === "link" ? (
          <Link
            href={profileHref}
            className="mt-auto inline-flex h-10 items-center justify-center rounded-input bg-action text-compact font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#0668c7] active:translate-y-0 active:scale-[0.98]"
          >
            View Profile
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled
            title="Full professional profile pages are not published yet"
            className={cn(
              "mt-auto inline-flex h-10 cursor-not-allowed items-center justify-center",
              "rounded-input bg-tint text-compact font-medium text-navy/70",
            )}
          >
            View Profile
          </button>
        )}
      </div>
    </article>
  );
}
