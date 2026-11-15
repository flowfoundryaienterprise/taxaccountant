import type { Metadata } from "next";
import { KeyRound, Settings2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { fetchAuthQuery } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Site settings" };

const labels: Record<string, string> = {
  brandName: "Brand name", metaTitleTemplate: "Title template",
  siteDescription: "Default description", siteOrigin: "Canonical origin",
  contactEmail: "Public contact address", contactRoute: "Contact page route",
  socialLinks: "Social profiles", primaryNav: "Primary navigation",
  footerContent: "Footer content", displayLanguages: "Displayed languages",
  displayCurrencies: "Displayed currencies", featuredContent: "Featured content",
};

export default async function AdminSettingsScreen() {
  const settings = await fetchAuthQuery(api.adminData.listSettings, {});
  return <div className="flex flex-col gap-6">
    <AdminPageHeader title="Site settings" description="Non-secret configuration records stored in Convex. This screen shows stored values only." />
    <section aria-labelledby="secrets-note" className="flex gap-3 rounded-card border border-border bg-white p-5">
      <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden />
      <div className="flex flex-col gap-1.5"><h2 id="secrets-note" className="text-compact font-medium text-navy">Secrets stay in deployment configuration</h2>
        <p className="text-caption text-slate">Only allowlisted, non-sensitive setting keys are read here. API keys, credentials and authentication secrets are not displayed.</p>
      </div>
    </section>
    {settings.length ? <section aria-label="Stored settings" className="rounded-card border border-border bg-white p-5">
      <dl className="divide-y divide-border">{settings.map(setting => <div key={setting.key} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[14rem_1fr]">
        <dt className="text-compact font-medium text-navy">{labels[setting.key] ?? setting.key}</dt>
        <dd className="break-words text-compact text-slate">{setting.value}</dd>
      </div>)}</dl>
    </section> : <AdminEmptyState icon={Settings2} title="No settings stored" description="The site currently uses configuration from its code and deployment environment. No siteSettings records have been authored." />}
    <p className="text-caption text-slate">Settings are read-only here until an audited write workflow is added and the public site consumes those values.</p>
  </div>;
}
