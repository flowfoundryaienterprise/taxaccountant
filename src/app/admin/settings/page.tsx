import type { Metadata } from "next";
import { KeyRound, Lock } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ReadOnlyNotice } from "@/components/admin/admin-notices";
import { settingGroups } from "@/lib/admin/admin-fixtures";

export const metadata: Metadata = { title: "Site settings" };

/**
 * Website settings.
 *
 * ## No secret can appear here, by construction
 * The settings model has no field for an API key, deployment credential,
 * auth secret, R2 access key or Cloudflare token — so there is nothing for
 * this screen to render even by accident. `siteSettings` in DATABASE.md is
 * documented as holding "allowlisted, non-secret configuration values only",
 * and secrets live in the deployment environment, never in a database row
 * and never in a page a browser can load.
 *
 * Fields marked `implemented` show the value the site genuinely uses today,
 * read from the codebase. Fields marked `pending` have no storage at all and
 * render as disabled placeholders rather than as inputs that would silently
 * discard whatever was typed into them.
 */
export default function AdminSettingsScreen() {
  const implemented = settingGroups.flatMap((group) =>
    group.fields.filter((field) => field.state === "implemented"),
  ).length;
  const pending = settingGroups.flatMap((group) =>
    group.fields.filter((field) => field.state === "pending"),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Site settings"
        description={`Site identity, navigation and display configuration. ${implemented} settings reflect live values; ${pending} have no storage yet.`}
      />

      <section
        aria-labelledby="secrets-note"
        className="flex gap-3 rounded-card border border-border bg-white p-5"
      >
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id="secrets-note" className="text-compact font-medium text-navy">
            Secrets are not configurable here and never will be
          </h2>
          <p className="max-w-[92ch] text-caption text-slate">
            API keys, Convex deployment credentials, authentication secrets, R2 access keys and
            Cloudflare tokens are held in the deployment environment. They are not stored in the
            database, not exposed to any CMS screen, and have no field in this model — so this page
            cannot display or leak one. Only allowlisted, non-sensitive display configuration
            belongs in site settings.
          </p>
        </div>
      </section>

      {settingGroups.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`settings-${group.id}`}
          className="flex flex-col gap-4 rounded-card border border-border bg-white p-5"
        >
          <div className="flex flex-col gap-1">
            <h2 id={`settings-${group.id}`} className="text-compact font-medium text-navy">
              {group.title}
            </h2>
            <p className="max-w-[80ch] text-caption text-slate">{group.description}</p>
          </div>

          <dl className="flex flex-col gap-4">
            {group.fields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-1.5 border-b border-border pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="text-compact font-medium text-navy">{field.label}</dt>
                  <AdminStatusBadge
                    status={field.state === "implemented" ? "published" : "draft"}
                    label={field.state === "implemented" ? "In use" : "Not implemented"}
                    tone={field.state === "implemented" ? "success" : "neutral"}
                  />
                </div>

                <dd className="flex flex-col gap-1.5">
                  {field.value ? (
                    <div className="flex items-center gap-2 rounded-input border border-border bg-subtle px-3 py-2.5">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
                      <span className="min-w-0 break-words text-compact text-slate">
                        {field.value}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-input border border-dashed border-border bg-white px-3 py-2.5">
                      <span className="text-compact text-slate">No value stored</span>
                    </div>
                  )}

                  <p className="text-caption text-slate">{field.hint}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section
        aria-labelledby="settings-authorization"
        className="flex flex-col gap-2 rounded-card border border-warning/40 bg-white p-5"
      >
        <h2 id="settings-authorization" className="text-compact font-medium text-navy">
          Why every field is read-only
        </h2>
        <p className="max-w-[92ch] text-caption text-slate">
          Site settings change what every visitor sees, so they are exactly the kind of
          configuration that needs an authenticated, authorized actor and an audit record —
          <code className="mx-1 font-mono">settings:getPublic</code> is a public read in API.md,
          but there is no corresponding write, and no identity to attribute a change to. Making
          these editable before that exists would mean an unauthenticated interface could alter
          the public site.
        </p>
      </section>

      <ReadOnlyNotice />
    </div>
  );
}
