import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe2,
  Languages,
  MapPin,
  Scale,
  ShieldAlert,
} from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { PortraitImage } from "@/components/shared/portrait-image";
import { buttonVariants } from "@/components/ui/button";
import {
  consultationLabel,
  designationLine,
  detailedLocationLine,
  hasVerifiedCredential,
  jurisdictionShortLabels,
  jurisdictionCodes,
  languageLabels,
  primaryLocation,
  profileName,
} from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  profile: ProfessionalProfile;
  /** Directory URL to return to, rebuilt from validated filters. */
  backHref: string;
  backLabel: string;
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

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
      <div className="min-w-0">
        <dt className="sr-only">{label}</dt>
        <dd className="min-w-0 break-words text-compact text-slate">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Profile header.
 *
 * Carries only facts held on the record: identity, designations, practice
 * location, the tax jurisdictions attached to the professional's services,
 * languages and consultation mode. No rating area, no fee, no availability,
 * no "verified" chrome — DESIGN.md section 5 (`ProfileHero`): "structured
 * approved facts; verification indicator only when reviewed and approved".
 *
 * The three primary actions are the ones that can actually do something
 * today: jump to the contact section, jump to the services section, and
 * return to the search results the reader came from. A Book Appointment
 * action is deliberately absent — booking is Phase 3.
 */
export function ProfileHeader({ profile, backHref, backLabel }: ProfileHeaderProps) {
  const name = profileName(profile);
  const designation = designationLine(profile);
  const location = primaryLocation(profile);
  const jurisdictions = jurisdictionShortLabels(jurisdictionCodes(profile));
  const languages = languageLabels(profile.languageCodes);
  const verified = hasVerifiedCredential(profile);

  return (
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Find an Accountant", href: "/find-accountant" },
            { label: name },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="group relative mx-auto w-full max-w-[320px] overflow-hidden rounded-panel border border-border bg-white shadow-[0_28px_60px_-44px_rgba(16,44,87,0.5)] lg:mx-0">
            {profile.photo ? (
              <PortraitImage
                src={profile.photo}
                alt={
                  profile.photoAlt ??
                  `Portrait of ${name}, a development-only example profile`
                }
                initials={initialsOf(name)}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 90vw"
                className="relative aspect-[4/5] w-full overflow-hidden bg-tint"
              />
            ) : (
              <div
                role="img"
                aria-label={`${name} has no profile photograph in this listing`}
                className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-tint via-white to-tint"
              >
                <span
                  aria-hidden
                  className="flex h-28 w-28 items-center justify-center rounded-full bg-navy text-heading-lg font-semibold text-white"
                >
                  {initialsOf(name)}
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-white px-3 py-1 text-caption font-semibold text-navy">
                  {profile.kind === "firm" ? "Firm practice" : "Individual professional"}
                </span>

                {/*
                  Status chip, never a badge. `hasVerifiedCredential` requires
                  both an approved status and the review timestamp a real
                  documentary review writes, so a fixture cannot produce the
                  verified wording on its own.
                */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium",
                    verified
                      ? "border-success/30 bg-white text-success"
                      : "border-border bg-white text-slate",
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                  {verified
                    ? "Credentials reviewed by the marketplace"
                    : "Credentials not yet verified by the marketplace"}
                </span>
              </div>

              <h1 className="max-w-[20ch] text-hero font-semibold text-navy">{name}</h1>

              {designation ? (
                <p className="text-lead text-slate">
                  <span className="sr-only">Self-declared designation: </span>
                  {designation}
                </p>
              ) : null}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {location ? (
                <Fact icon={MapPin} label="Practice location">
                  {detailedLocationLine(location)}
                </Fact>
              ) : null}

              {profile.firmName ? (
                <Fact icon={Building2} label="Firm or practice">
                  {profile.firmName}
                </Fact>
              ) : null}

              {jurisdictions.length ? (
                <Fact icon={Scale} label="Tax jurisdictions served">
                  {jurisdictions.join(" · ")}
                </Fact>
              ) : null}

              {languages.length ? (
                <Fact icon={Languages} label="Languages">
                  {languages.join(", ")}
                </Fact>
              ) : null}

              <Fact icon={Globe2} label="Consultation">
                {consultationLabel(profile)}
              </Fact>
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#contact"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full whitespace-normal text-center sm:w-auto",
                )}
              >
                Contact Professional
              </a>
              <a
                href="#services"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full whitespace-normal text-center sm:w-auto",
                )}
              >
                Explore Services
              </a>
              <Link
                href={backHref}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "group w-full justify-center whitespace-normal text-center sm:w-auto",
                )}
              >
                <ArrowLeft
                  className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5"
                  aria-hidden
                />
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
