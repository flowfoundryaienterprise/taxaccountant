import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Scale } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import {
  adminCountries,
  adminJurisdictions,
  adminProfessionals,
  jurisdictionName,
  languageName,
  serviceName,
} from "@/lib/admin/admin-data";

interface CountryDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CountryDetailProps): Promise<Metadata> {
  const { id } = await params;
  const record = adminCountries().find((country) => country.code === id.toUpperCase());
  return { title: record ? record.name : "Country not found" };
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-slate">{label}</dt>
      <dd className="min-w-0 break-words text-compact font-medium text-navy">{value}</dd>
    </div>
  );
}

/**
 * Country detail.
 *
 * Shows the country record, its discovery and activation state, its tax
 * jurisdictions, the service categories genuinely represented there, the
 * professional listings attached to it, and its SEO metadata.
 *
 * The four blocks are separated deliberately — see the list screen's note.
 * In particular, "tax jurisdictions" lists the authorities that exist for
 * this country; it is not a claim that any professional is authorized for
 * them, which is a per-professional fact shown on the listings block.
 */
export default async function AdminCountryDetailScreen({ params }: CountryDetailProps) {
  const { id } = await params;
  const code = id.toUpperCase();
  const record = adminCountries().find((country) => country.code === code);

  if (!record) notFound();

  const jurisdictions = adminJurisdictions().filter(
    (jurisdiction) => jurisdiction.countryCode === code,
  );
  const listings = adminProfessionals().filter(
    (professional) => professional.countryCode === code,
  );
  const publishedListings = listings.filter((listing) => listing.status === "published");

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={record.name}
        description={`ISO ${record.code} · default locale ${record.defaultLocale} · display currency ${record.displayCurrency}`}
        actions={
          <>
            <AdminStatusBadge
              status={record.discoverable ? "published" : "draft"}
              label={record.discoverable ? "Discoverable" : "Not discoverable"}
              tone={record.discoverable ? "success" : "neutral"}
            />
            <Link
              href={`/countries/${record.code}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-input border border-border bg-white px-4 text-compact font-medium text-navy hover:bg-subtle"
            >
              View public page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </>
        }
      />

      <ProvenanceNotice provenance={record.provenance} entity="country records" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="country-info"
          className="flex flex-col gap-4 rounded-card border border-border bg-white p-5"
        >
          <h2 id="country-info" className="text-compact font-medium text-navy">
            Country information
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <Fact label="Country name" value={record.name} />
            <Fact label="ISO 3166-1 alpha-2" value={record.code} />
            <Fact label="Default locale" value={record.defaultLocale} />
            <Fact label="Display currency" value={record.displayCurrency} />
            <Fact label="Record status" value={<AdminStatusBadge status={record.status} />} />
            <Fact
              label="Public discovery"
              value={record.discoverable ? "Appears in browsing" : "Hidden from browsing"}
            />
          </dl>
        </section>

        <section
          aria-labelledby="country-activation"
          className="flex flex-col gap-4 rounded-card border border-border bg-white p-5"
        >
          <h2 id="country-activation" className="text-compact font-medium text-navy">
            Marketplace activation
          </h2>
          <p className="text-caption text-slate">
            Three independent permissions. None follows from discovery, and none is editable
            without the approved activation checklist.
          </p>
          <dl className="flex flex-col gap-3">
            {[
              { label: "Professional onboarding", value: record.onboardingEnabled },
              { label: "Transactions", value: record.transactionEnabled },
              { label: "Payments", value: record.paymentEnabled },
            ].map((flag) => (
              <div key={flag.label} className="flex items-center justify-between gap-3">
                <dt className="text-compact text-slate">{flag.label}</dt>
                <dd>
                  <AdminStatusBadge
                    status={flag.value ? "published" : "draft"}
                    label={flag.value ? "Enabled" : "Not enabled"}
                    tone={flag.value ? "success" : "neutral"}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="country-jurisdictions"
          className="flex flex-col gap-3 rounded-card border border-border bg-white p-5"
        >
          <h2 id="country-jurisdictions" className="text-compact font-medium text-navy">
            Tax jurisdictions
          </h2>
          <p className="text-caption text-slate">
            Authorities configured for this country. This is not a statement that any professional
            is authorized for them.
          </p>

          {jurisdictions.length === 0 ? (
            <p className="text-caption text-slate">No jurisdictions are configured.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {jurisdictions.map((jurisdiction) => (
                <li
                  key={jurisdiction.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-input bg-subtle px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Scale className="h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
                    <span className="min-w-0 break-words text-caption font-medium text-navy">
                      {jurisdiction.label}
                    </span>
                  </span>
                  <code className="font-mono text-caption text-slate">{jurisdiction.code}</code>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="country-services"
          className="flex flex-col gap-3 rounded-card border border-border bg-white p-5"
        >
          <h2 id="country-services" className="text-compact font-medium text-navy">
            Service categories represented
          </h2>
          <p className="text-caption text-slate">
            Derived from the listings that genuinely exist for this country, not configured
            separately.
          </p>

          {record.serviceSlugs.length === 0 ? (
            <p className="text-caption text-slate">
              No service category is represented by any listing here.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {record.serviceSlugs.map((slug) => (
                <li
                  key={slug}
                  className="rounded-full bg-subtle px-2.5 py-1 text-caption text-slate"
                >
                  {serviceName(slug)}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-2 text-caption font-medium text-navy">Languages represented</h3>
          {record.languageCodes.length === 0 ? (
            <p className="text-caption text-slate">None recorded.</p>
          ) : (
            <p className="text-caption text-slate">
              {record.languageCodes.map(languageName).join(", ")}
            </p>
          )}
        </section>
      </div>

      <section
        aria-labelledby="country-listings"
        className="flex flex-col gap-3 rounded-card border border-border bg-white p-5"
      >
        <h2 id="country-listings" className="text-compact font-medium text-navy">
          Professional listings based here
        </h2>
        <p className="text-caption text-slate">
          {publishedListings.length} published of {listings.length} record
          {listings.length === 1 ? "" : "s"}. Being based in a country is separate from being
          authorized for its tax jurisdictions — the jurisdictions each listing states are shown on
          its own record.
        </p>

        {listings.length === 0 ? (
          <p className="text-caption text-slate">No professional records are based here.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input bg-subtle px-3 py-2"
              >
                <Link
                  href={`/admin/professionals/${listing.slug}`}
                  className="min-w-0 text-caption font-medium text-navy hover:text-action hover:underline"
                >
                  {listing.firmName ?? listing.displayName}
                </Link>
                <span className="flex items-center gap-2">
                  <span className="text-caption text-slate">
                    {listing.jurisdictionCodes.map(jurisdictionName).join(" · ") || "No jurisdictions"}
                  </span>
                  <AdminStatusBadge status={listing.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="country-seo"
        className="flex flex-col gap-3 rounded-card border border-border bg-white p-5"
      >
        <h2 id="country-seo" className="text-compact font-medium text-navy">
          SEO metadata
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="SEO title" value={record.seo.title ?? "Not set"} />
          <Fact label="Canonical path" value={record.seo.canonicalPath ?? "Not set"} />
          <Fact
            label="Meta description"
            value={record.seo.description ?? "Not set — the public page generates one"}
          />
          <Fact
            label="Indexing"
            value="noindex — the page renders development fixtures"
          />
        </dl>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
