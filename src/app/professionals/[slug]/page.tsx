import { publicConvexClient } from "@/lib/convex/public-client";
import { api } from "@/convex/_generated/api";
import { LiveProfile } from "@/components/professionals/live-profile";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe2, Languages, MapPin, Scale, ShieldAlert } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ContactProfessional } from "@/components/professionals/contact-professional";
import { CredentialsSection } from "@/components/professionals/credentials-section";
import { JurisdictionCoverage } from "@/components/professionals/jurisdiction-coverage";
import { LanguagesSection } from "@/components/professionals/languages-section";
import { ProfessionalOverview } from "@/components/professionals/professional-overview";
import { ProfessionalServices } from "@/components/professionals/professional-services";
import { ProfileActionBar } from "@/components/professionals/profile-action-bar";
import { ProfileHeader } from "@/components/professionals/profile-header";
import { ProfilePreviewNotice } from "@/components/professionals/profile-preview-notice";
import { RelatedProfessionals } from "@/components/professionals/related-professionals";
import { ServiceFaq } from "@/components/services/service-faq";
import { allCityTokens } from "@/lib/directory/filters";
import { directoryFixtures } from "@/lib/directory/fixtures";
import {
  DIRECTORY_PATH,
  buildDirectoryHref,
  hasActiveFilters,
  parseDirectoryFilters,
  type RawSearchParams,
} from "@/lib/directory/query-params";
import {
  consultationLabel,
  jurisdictionCodes,
  languageLabels,
  primaryLocation,
  locationLine,
  profileFaqs,
  profileMetaDescription,
  profileName,
  relatedProfessionals,
} from "@/lib/professionals/profile-formatters";
import {
  getPublishedProfile,
  publishedProfileSlugs,
} from "@/lib/professionals/profile-fixtures";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";
import { professionalHref } from "@/lib/marketplace/query-params";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

/**
 * Only published, approved profiles are pre-rendered. Draft, suspended and
 * archived fixtures are absent from this list and from `getPublishedProfile`,
 * so a guessed URL for one resolves to the same not-found page as a typo —
 * it never confirms that the profile exists (API.md section 1).
 */
export function generateStaticParams() {
  return publishedProfileSlugs.map((slug) => ({ slug }));
}

/** Upper bound on the carried-back directory query, so `?from=` stays sane. */
const MAX_RETURN_LENGTH = 512;

/**
 * Rebuilds the "back to results" link from `?from=`.
 *
 * The parameter is never used as a URL. It is parsed through the directory's
 * own validator — which drops unknown countries, services, jurisdictions,
 * languages and cities — and the href is then rebuilt against
 * `DIRECTORY_PATH`. A hand-edited or hostile value therefore degrades to a
 * plain `/find-accountant` link and can never redirect off-site.
 */
function resolveBackLink(raw: RawSearchParams): { href: string; label: string } {
  const input = Array.isArray(raw.from) ? raw.from[0] : raw.from;

  if (!input || input.length > MAX_RETURN_LENGTH) {
    return { href: DIRECTORY_PATH, label: "Back to Search Results" };
  }

  const params = new URLSearchParams(input);
  const carried: RawSearchParams = {};
  for (const [key, value] of params) {
    const existing = carried[key];
    if (existing === undefined) carried[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else carried[key] = [existing, value];
  }

  const filters = parseDirectoryFilters(carried, allCityTokens(directoryFixtures));

  return {
    href: buildDirectoryHref(filters),
    label: hasActiveFilters(filters)
      ? "Back to Search Results (filters kept)"
      : "Back to Search Results",
  };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (process.env.NODE_ENV === "production") {
    const live = await publicConvexClient.query(api.professionals.publicProfile, {slug});
    return {title:live?.displayName ?? "Profile not found",description:live?.bio.slice(0,160),robots:{index:!!live,follow:true},alternates:{canonical:professionalHref(slug)}};
  }
  const profile = getPublishedProfile(slug);

  if (!profile) {
    return { title: "Profile not found", robots: { index: false, follow: true } };
  }

  const name = profileName(profile);
  const location = primaryLocation(profile);
  const canonical = professionalHref(profile.slug);
  const description = profileMetaDescription(profile);

  return {
    title: location ? `${name} — ${locationLine(location)}` : name,
    description,
    // Canonical is the bare profile path: `?from=` is a navigation
    // convenience, never a second address for the same page.
    alternates: { canonical },
    openGraph: {
      title: `${name} | TaxAccountant.com`,
      description,
      url: canonical,
      type: "profile",
    },
    /*
     * Never indexable. These profiles are development fixtures describing
     * people who do not exist (Day 5 brief section 17: "Do not index
     * development-only fictional profiles"), and the directory that links
     * here is `noindex` for the same reason. Flip to `index: true` only once
     * `professionals:getPublishedBySlug` serves approved, published, real
     * profiles.
     *
     * No `Person` / `ProfessionalService` JSON-LD is emitted for the same
     * reason: structured data is only warranted when the facts behind it are
     * real, and these are not.
     */
    robots: { index: false, follow: true },
  };
}

function AtAGlance({ profile }: { profile: ProfessionalProfile }) {
  const location = primaryLocation(profile);
  const jurisdictions = jurisdictionCodes(profile);
  const languages = languageLabels(profile.languageCodes);

  const rows: { icon: typeof MapPin; label: string; value: string }[] = [
    ...(location
      ? [{ icon: MapPin, label: "Practice location", value: locationLine(location) }]
      : []),
    {
      icon: Scale,
      label: "Tax jurisdictions",
      value: jurisdictions.length
        ? `${jurisdictions.length} listed`
        : "None listed",
    },
    {
      icon: Languages,
      label: "Languages",
      value: languages.length ? languages.join(", ") : "None listed",
    },
    { icon: Globe2, label: "Consultation", value: consultationLabel(profile) },
    {
      icon: ShieldAlert,
      label: "Credential status",
      value: "Not yet verified by the marketplace",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
      <h2 className="text-compact font-semibold text-navy">At a glance</h2>

      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 items-start gap-2">
            <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
            <div className="min-w-0">
              <dt className="text-caption text-slate">{row.label}</dt>
              <dd className="min-w-0 break-words text-caption font-medium text-navy">
                {row.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

const SECTION_LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services & specialties" },
  { href: "#jurisdictions", label: "Countries & tax jurisdictions" },
  { href: "#credentials", label: "Qualifications & credentials" },
  { href: "#languages", label: "Languages & consultation" },
  { href: "#contact", label: "Contact" },
];

/**
 * The single canonical professional profile route.
 *
 * A Server Component: every section renders from one read, and the only
 * client-side code on the page is the shared `PortraitImage` fallback and the
 * FAQ accordion. There is no second profile implementation anywhere — the
 * directory, the homepage highlights, the service and country previews and
 * the related-professionals strip all build their links through
 * `professionalHref`.
 *
 * ## Data source
 * `getPublishedProfile` reads `@/lib/professionals/profile-fixtures` —
 * typed, development-only examples derived from the Day 3 directory rows.
 * There is no `convex/professionals` module yet;
 * `professionals:getPublishedBySlug` is IMPLEMENTATION_PLAN.md Day 10 and the
 * Day 5 brief forbids building backend services here. The swap is contained:
 * replace that one call with the query result and keep the
 * `ProfessionalProfile` shape. Publication filtering already lives behind the
 * same function, so unapproved rows cannot leak through the UI either way.
 */
export default async function ProfessionalProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { slug } = await params;
  if (process.env.NODE_ENV === "production") {
    const live = await publicConvexClient.query(api.professionals.publicProfile, {slug});
    if (!live) notFound();
    return <LiveProfile profile={live} />;
  }
  const profile = getPublishedProfile(slug);

  if (!profile) notFound();

  const raw = await searchParams;
  const back = resolveBackLink(raw);

  const name = profileName(profile);
  const related = relatedProfessionals(profile);
  const faqs = profileFaqs(profile);

  // Carried on through related-professional links, so a reader can hop
  // between profiles without losing the search they started from.
  const returnTo = back.href.startsWith(`${DIRECTORY_PATH}?`)
    ? back.href.slice(DIRECTORY_PATH.length + 1)
    : undefined;

  return (
    /* Bottom padding reserves room for the mobile action bar, so the last
       section is never hidden behind it. */
    <div className="pb-24 sm:pb-0">
      <ProfileHeader profile={profile} backHref={back.href} backLabel={back.label} />

      <Container className="py-8 sm:py-10">
        <ProfilePreviewNotice name={name} />
      </Container>

      <Container className="grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-14">
          <ProfessionalOverview profile={profile} />
          <ProfessionalServices profile={profile} />
          <JurisdictionCoverage profile={profile} />
          <CredentialsSection profile={profile} />
          <LanguagesSection profile={profile} />
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <AtAGlance profile={profile} />

          <nav
            aria-label="Profile sections"
            className="flex flex-col gap-3 rounded-card border border-border bg-tint/60 p-5"
          >
            <h2 className="text-compact font-semibold text-navy">On this page</h2>
            <ul className="flex flex-col gap-2">
              {SECTION_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-caption text-slate transition-colors duration-150 hover:text-action hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </Container>

      <ContactProfessional profile={profile} />

      <ServiceFaq
        id="profile-faqs"
        items={faqs}
        eyebrow="Profile FAQs"
        title={`Working with ${name}`}
        description="How this listing works, and what this page deliberately does not claim."
        tone="tinted"
      />

      <RelatedProfessionals professionals={related} returnTo={returnTo} />

      <ProfileActionBar
        backHref={back.href}
        contactAvailable={profile.publicContactMode !== "none"}
      />
    </div>
  );
}
