import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ProvenanceNotice, ReadOnlyNotice } from "@/components/admin/admin-notices";
import { countryName, jurisdictionName, languageName, serviceName } from "@/lib/admin/admin-data";
import { unpublishedProfileFixtures } from "@/lib/admin/admin-unpublished-fixtures";
import { publishedProfiles } from "@/lib/professionals/profile-fixtures";

/** Published and unpublished together — the internal publication view. */
const cmsProfiles = [...publishedProfiles, ...unpublishedProfileFixtures];

interface ProfessionalDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfessionalDetailProps): Promise<Metadata> {
  const { id } = await params;
  const record = cmsProfiles.find((profile) => profile.slug === id);
  return { title: record ? record.displayName : "Listing not found" };
}

function Panel({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-card border border-border bg-white p-5"
    >
      <h2 id={id} className="text-compact font-semibold text-navy">
        {title}
      </h2>
      {description ? <p className="text-caption text-slate">{description}</p> : null}
      {children}
    </section>
  );
}

/**
 * Professional listing detail.
 *
 * Shows the public-facing record — biography, services, jurisdictions,
 * languages, locations, credential status and publication state — so a
 * content editor can review what the marketplace would publish.
 *
 * Nothing private appears: the model carries no identity document,
 * credential evidence, licence number, contact detail or internal note, so
 * there is nothing here to leak. The only action offered is a link to the
 * public profile, and that link is shown only when the listing is actually
 * published, so this screen cannot hand someone a URL to an unpublished
 * record.
 */
export default async function AdminProfessionalDetailScreen({
  params,
}: ProfessionalDetailProps) {
  const { id } = await params;
  const record = cmsProfiles.find((profile) => profile.slug === id);

  if (!record) notFound();

  const isPublished = record.publicationStatus === "published" && record.approvedProfile;
  const jurisdictions = [
    ...new Set(record.services.flatMap((service) => service.jurisdictionCodes)),
  ];
  const reviewedCredentials = record.credentials.filter(
    (credential) =>
      credential.publicDisplayStatus === "verified" && credential.reviewedAt !== undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={record.firmName ?? record.displayName}
        description={`${record.kind === "firm" ? "Firm practice" : "Individual professional"} · slug ${record.slug}`}
        actions={
          <>
            <AdminStatusBadge status={record.publicationStatus} />
            {isPublished ? (
              <Link
                href={`/professionals/${record.slug}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-input border border-border bg-white px-4 text-compact font-medium text-navy hover:bg-tint"
              >
                View public profile
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : (
              <span
                title="This listing is not published, so it has no public page"
                className="inline-flex min-h-11 cursor-not-allowed items-center gap-1.5 rounded-input border border-border bg-tint/50 px-4 text-compact font-medium text-slate"
              >
                No public page
              </span>
            )}
          </>
        }
      />

      <ProvenanceNotice provenance="approved" entity="professional listing records" />

      {!isPublished ? (
        <p className="flex gap-2 rounded-card border border-warning/40 bg-white px-4 py-3 text-caption text-slate">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            <strong className="font-semibold text-navy">Not publicly visible.</strong> This record
            is <em>{record.publicationStatus}</em>
            {record.approvedProfile ? "" : " and has not been approved for publication"}, so the
            public profile route returns not-found for it — indistinguishably from a mistyped
            address, so its existence is not disclosed.
          </span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="listing-bio" title="Biography">
          {record.bio.length ? (
            <div className="flex flex-col gap-3">
              {record.bio.map((paragraph, index) => (
                <p key={index} className="text-caption text-slate">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-caption text-slate">
              No biography has been supplied. The public profile renders an honest empty state
              rather than generated text.
            </p>
          )}
        </Panel>

        <Panel
          id="listing-publication"
          title="Publication state"
          description="Approval and publication are separate gates, and the public read requires both."
        >
          <dl className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-compact text-slate">Profile approved</dt>
              <dd>
                <AdminStatusBadge
                  status={record.approvedProfile ? "published" : "draft"}
                  label={record.approvedProfile ? "Approved" : "Not approved"}
                  tone={record.approvedProfile ? "success" : "neutral"}
                />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-compact text-slate">Publication status</dt>
              <dd>
                <AdminStatusBadge status={record.publicationStatus} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-compact text-slate">Verification status</dt>
              <dd>
                <AdminStatusBadge status={record.verificationStatus} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-compact text-slate">Public contact mode</dt>
              <dd className="text-compact font-medium text-navy">{record.publicContactMode}</dd>
            </div>
          </dl>
        </Panel>

        <Panel
          id="listing-services"
          title="Services and jurisdictions"
          description="Each service is paired with the tax jurisdictions this listing states for it — not with every jurisdiction the professional claims."
        >
          {record.services.length === 0 ? (
            <p className="text-caption text-slate">No service mappings on this record.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {record.services.map((service) => (
                <li
                  key={service.serviceSlug}
                  className="flex flex-col gap-1 rounded-input bg-tint/50 px-3 py-2"
                >
                  <span className="text-caption font-medium text-navy">
                    {serviceName(service.serviceSlug)}
                  </span>
                  <span className="text-caption text-slate">
                    {service.jurisdictionCodes.map(jurisdictionName).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel id="listing-locations" title="Locations and languages">
          <h3 className="text-caption font-semibold text-navy">Practice locations</h3>
          <ul className="flex flex-col gap-1">
            {record.locations.map((location, index) => (
              <li key={index} className="text-caption text-slate">
                {[location.city, location.region, countryName(location.countryCode)]
                  .filter(Boolean)
                  .join(", ")}
                {location.isPrimary ? " (primary)" : ""}
              </li>
            ))}
          </ul>

          <h3 className="mt-2 text-caption font-semibold text-navy">Languages</h3>
          <p className="text-caption text-slate">
            {record.languageCodes.length
              ? record.languageCodes.map(languageName).join(", ")
              : "None recorded"}
          </p>

          <h3 className="mt-2 text-caption font-semibold text-navy">Tax jurisdictions (all)</h3>
          <p className="text-caption text-slate">
            {jurisdictions.length ? jurisdictions.map(jurisdictionName).join(" · ") : "None"}
          </p>
        </Panel>
      </div>

      <Panel
        id="listing-credentials"
        title="Credential status summary"
        description="Status only. No certificate, licence number or supporting document is held in the public listing model, so none can be displayed here."
      >
        {record.credentials.length === 0 ? (
          <p className="text-caption text-slate">No credentials are recorded on this listing.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {record.credentials.map((credential, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input bg-tint/50 px-3 py-2"
              >
                <span className="text-caption font-medium text-navy">
                  {credential.designation}
                </span>
                <AdminStatusBadge
                  status={credential.publicDisplayStatus}
                  label={
                    credential.publicDisplayStatus === "verified" && credential.reviewedAt
                      ? "Reviewed and approved"
                      : credential.publicDisplayStatus === "verified"
                        ? "Marked verified without a review record"
                        : "Self-declared, not reviewed"
                  }
                  tone={
                    credential.publicDisplayStatus === "verified" && credential.reviewedAt
                      ? "success"
                      : credential.publicDisplayStatus === "verified"
                        ? "danger"
                        : "neutral"
                  }
                />
              </li>
            ))}
          </ul>
        )}

        <p className="rounded-input bg-tint/70 px-3 py-2 text-caption text-slate">
          {reviewedCredentials.length === 0
            ? "No credential on this listing has a completed review record, so the public profile shows none of them as verified."
            : `${reviewedCredentials.length} credential(s) carry a completed review record.`}{" "}
          A credential marked verified without a review timestamp is a data fault, and is flagged
          in red above rather than being displayed as verified.
        </p>
      </Panel>

      <ReadOnlyNotice />
    </div>
  );
}
