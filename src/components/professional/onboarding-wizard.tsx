"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Globe2,
  Languages as LanguagesIcon,
  MapPin,
  Trash2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ClaimSearch } from "./claim-search";

/**
 * Professional onboarding entry screen + wizard (Task 9, Steps 1-2).
 *
 * Entry (`OnboardingWizard`/`OnboardingFlow`): resolves which of the
 * caller's organizations are eligible to own a listing at all — an
 * `owner`/`admin` of a `professional_firm` organization, the exact gate
 * `createProfessionalDraft`/`requestProfessionalClaim`
 * (`convex/professionalOwnership.ts`) enforce server-side — then offers the
 * "create new" vs "claim existing" choice. The claim path hands off to
 * `claim-search.tsx` and, on a successful claim request, lands on a static
 * "pending staff review" state rather than the wizard: a `pending`
 * `professionalOwnership` row grants no edit access
 * (`requireProfessionalEditAccess` only honors `"approved"`), so there is
 * nothing here for the wizard to edit yet.
 *
 * Wizard (`Wizard`): one step per Task 6 mutation — basics, services,
 * locations, languages, credentials, review — matching the create-then-
 * autosave design: each step's "Next" calls that step's mutation before
 * advancing, so a browser refresh mid-wizard never loses already-saved
 * steps (though resuming one, if abandoned, has nowhere to read back from
 * yet — no `professionals:get`-style query exists for this task to use, and
 * adding one is outside its scope). Services/locations/credentials steps
 * scope a `taxJurisdictions` picker to a chosen country via
 * `api.taxonomy.listTaxJurisdictions`, using the `useQuery` "skip" sentinel
 * until a country is chosen (same pattern `claim-search.tsx` and
 * `src/components/shared/ensure-app-user.tsx` already use for a conditional
 * query).
 */

type OrgRow = FunctionReturnType<typeof api.organizations.currentOrganizations>[number];
type CountryRow = FunctionReturnType<typeof api.taxonomy.listCountries>[number];
type JurisdictionRow = FunctionReturnType<typeof api.taxonomy.listTaxJurisdictions>[number];
type ServiceCategoryRow = FunctionReturnType<typeof api.taxonomy.listServiceCategories>[number];
type LanguageRow = FunctionReturnType<typeof api.taxonomy.listLanguages>[number];

type ProfessionalKind = "individual" | "firm";
type ContactMode = "contact_form" | "external" | "none";

interface ServiceEntry {
  key: string;
  serviceId: Id<"serviceCategories">;
  serviceName: string;
  taxJurisdictionId: Id<"taxJurisdictions">;
  jurisdictionLabel: string;
  remote: boolean;
  description?: string;
}

interface LocationEntry {
  key: string;
  countryId: Id<"countries">;
  countryName: string;
  city: string;
  region?: string;
  publicLocationText?: string;
  isPrimary: boolean;
}

interface CredentialEntry {
  credentialId: Id<"professionalPublicCredentials">;
  designation: string;
  issuer?: string;
  jurisdictionLabel?: string;
}

interface BasicsValues {
  displayName: string;
  kind: ProfessionalKind;
  firmName: string;
  bio: string;
  remoteServices: boolean;
  inPersonServices: boolean;
  publicContactMode: ContactMode;
}

export function OnboardingWizard() {
  const organizations = useQuery(api.organizations.currentOrganizations, {});

  if (organizations === undefined) {
    return <p className="text-compact text-slate">Loading your organizations…</p>;
  }

  const eligibleOrgs = organizations.filter(
    (org): org is OrgRow =>
      org.kind === "professional_firm" && (org.role === "owner" || org.role === "admin"),
  );

  if (eligibleOrgs.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6">
        <p className="flex items-center gap-2 text-compact font-medium text-navy">
          <Building2 className="h-4 w-4 text-action" aria-hidden />
          You need a professional-firm organization first
        </p>
        <p className="text-caption text-slate">
          Only an owner or admin of a professional-firm organization can create or claim a
          listing here.
        </p>
        <Link href="/organization/new" className="text-caption font-semibold text-action">
          Create an organization →
        </Link>
      </div>
    );
  }

  return <OnboardingFlow eligibleOrgs={eligibleOrgs} />;
}

type Stage = "choice" | "create-entry" | "claim-entry" | "claim-pending" | "wizard" | "submitted";

function OnboardingFlow({ eligibleOrgs }: { eligibleOrgs: OrgRow[] }) {
  const [organizationId, setOrganizationId] = React.useState<Id<"organizations">>(
    eligibleOrgs[0].organizationId,
  );
  const [stage, setStage] = React.useState<Stage>("choice");
  const [professionalId, setProfessionalId] = React.useState<Id<"professionals"> | null>(null);
  const [initialBasics, setInitialBasics] = React.useState<BasicsValues | null>(null);

  const createDraft = useMutation(api.professionalOwnership.createProfessionalDraft);

  if (stage === "choice") {
    return (
      <div className="flex flex-col gap-6">
        {eligibleOrgs.length > 1 ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="org-select" className="text-caption font-medium text-slate">
              Acting as
            </label>
            <select
              id="org-select"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value as Id<"organizations">)}
              className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
            >
              {eligibleOrgs.map((org) => (
                <option key={org.organizationId} value={org.organizationId}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setStage("create-entry")}
            className="flex flex-col gap-2 rounded-[1.25rem] border border-border bg-white p-6 text-left transition-colors duration-150 hover:border-action"
          >
            <ClipboardList className="h-5 w-5 text-action" aria-hidden />
            <span className="font-medium text-navy">Create a new listing</span>
            <span className="text-caption text-slate">
              Your firm or practice doesn&apos;t have a listing in the directory yet.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStage("claim-entry")}
            className="flex flex-col gap-2 rounded-[1.25rem] border border-border bg-white p-6 text-left transition-colors duration-150 hover:border-action"
          >
            <UserPlus className="h-5 w-5 text-action" aria-hidden />
            <span className="font-medium text-navy">Claim an existing listing</span>
            <span className="text-caption text-slate">
              There&apos;s already a published listing in the directory for you or your firm.
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (stage === "create-entry") {
    return (
      <CreateEntryForm
        onBack={() => setStage("choice")}
        onCreated={(id, basics) => {
          setProfessionalId(id);
          setInitialBasics(basics);
          setStage("wizard");
        }}
        createDraft={async (displayName, kind) => {
          const { professionalId: id } = await createDraft({
            organizationId,
            displayName,
            kind,
          });
          return id;
        }}
      />
    );
  }

  if (stage === "claim-entry") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage("choice")}
          className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-action"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </button>
        <ClaimSearch organizationId={organizationId} onClaimed={() => setStage("claim-pending")} />
      </div>
    );
  }

  if (stage === "claim-pending") {
    return (
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6">
        <p className="flex items-center gap-2 text-compact font-medium text-navy">
          <CheckCircle2 className="h-4 w-4 text-action" aria-hidden />
          Your claim is pending staff review
        </p>
        <p className="text-caption text-slate">
          A staff reviewer needs to approve your organization as the owner of this listing before
          you can edit it. You&apos;ll have no edit access to the listing until that happens —
          there&apos;s nothing further to do here right now.
        </p>
      </div>
    );
  }

  if (stage === "wizard" && professionalId && initialBasics) {
    return (
      <Wizard
        professionalId={professionalId}
        initialBasics={initialBasics}
        onSubmitted={() => setStage("submitted")}
      />
    );
  }

  // stage === "submitted"
  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-white p-6">
      <p className="flex items-center gap-2 text-compact font-medium text-navy">
        <CheckCircle2 className="h-4 w-4 text-action" aria-hidden />
        Draft saved and submitted for review
      </p>
      <p className="text-caption text-slate">
        A staff reviewer will check your listing before it&apos;s published to the directory.
        There&apos;s no dashboard to track this from yet — we&apos;ll be in touch once it&apos;s
        been reviewed.
      </p>
    </div>
  );
}

function CreateEntryForm({
  onBack,
  onCreated,
  createDraft,
}: {
  onBack: () => void;
  onCreated: (id: Id<"professionals">, basics: BasicsValues) => void;
  createDraft: (displayName: string, kind: ProfessionalKind) => Promise<Id<"professionals">>;
}) {
  const [displayName, setDisplayName] = React.useState("");
  const [kind, setKind] = React.useState<ProfessionalKind>("individual");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const id = await createDraft(displayName, kind);
      onCreated(id, {
        displayName,
        kind,
        firmName: "",
        bio: "",
        remoteServices: false,
        inPersonServices: false,
        publicContactMode: "contact_form",
      });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not create a draft listing.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-action"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back
      </button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-display-name" className="text-caption font-medium text-slate">
          Display name
        </label>
        <input
          id="new-display-name"
          type="text"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-caption font-medium text-slate">Listing type</legend>
        {(
          [
            { value: "individual", label: "Individual" },
            { value: "firm", label: "Firm" },
          ] as const
        ).map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-compact text-navy">
            <input
              type="radio"
              name="new-kind"
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating draft…" : "Start the wizard"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}

const WIZARD_STEPS = ["basics", "services", "locations", "languages", "credentials", "review"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

const STEP_LABELS: Record<WizardStep, string> = {
  basics: "Basics",
  services: "Services",
  locations: "Locations",
  languages: "Languages",
  credentials: "Credentials",
  review: "Review & submit",
};

function Wizard({
  professionalId,
  initialBasics,
  onSubmitted,
}: {
  professionalId: Id<"professionals">;
  initialBasics: BasicsValues;
  onSubmitted: () => void;
}) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const step = WIZARD_STEPS[stepIndex];

  const [basics, setBasics] = React.useState<BasicsValues>(initialBasics);
  const [services, setServices] = React.useState<ServiceEntry[]>([]);
  const [locations, setLocations] = React.useState<LocationEntry[]>([]);
  const [languages, setLanguages] = React.useState<LanguageRow[]>([]);
  const [credentials, setCredentials] = React.useState<CredentialEntry[]>([]);

  const countries = useQuery(api.taxonomy.listCountries, {});
  const serviceCategories = useQuery(api.taxonomy.listServiceCategories, {});
  const languageOptions = useQuery(api.taxonomy.listLanguages, {});

  function goNext() {
    setStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1));
  }
  function goBack() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-caption">
        {WIZARD_STEPS.map((candidate, index) => (
          <li
            key={candidate}
            className={
              index === stepIndex
                ? "rounded-full bg-tint px-3 py-1 font-semibold text-navy"
                : index < stepIndex
                  ? "rounded-full px-3 py-1 text-action"
                  : "rounded-full px-3 py-1 text-slate/60"
            }
          >
            {index + 1}. {STEP_LABELS[candidate]}
          </li>
        ))}
      </ol>

      {step === "basics" ? (
        <BasicsStep
          professionalId={professionalId}
          values={basics}
          onSaved={(values) => {
            setBasics(values);
            goNext();
          }}
        />
      ) : null}

      {step === "services" ? (
        <ServicesStep
          professionalId={professionalId}
          countries={countries}
          serviceCategories={serviceCategories}
          entries={services}
          onBack={goBack}
          onSaved={(entries) => {
            setServices(entries);
            goNext();
          }}
        />
      ) : null}

      {step === "locations" ? (
        <LocationsStep
          professionalId={professionalId}
          countries={countries}
          entries={locations}
          onBack={goBack}
          onSaved={(entries) => {
            setLocations(entries);
            goNext();
          }}
        />
      ) : null}

      {step === "languages" ? (
        <LanguagesStep
          professionalId={professionalId}
          options={languageOptions}
          selected={languages}
          onBack={goBack}
          onSaved={(selected) => {
            setLanguages(selected);
            goNext();
          }}
        />
      ) : null}

      {step === "credentials" ? (
        <CredentialsStep
          professionalId={professionalId}
          countries={countries}
          entries={credentials}
          onChange={setCredentials}
          onBack={goBack}
          onNext={goNext}
        />
      ) : null}

      {step === "review" ? (
        <ReviewStep
          professionalId={professionalId}
          basics={basics}
          services={services}
          locations={locations}
          languages={languages}
          credentials={credentials}
          onBack={goBack}
          onSubmitted={onSubmitted}
        />
      ) : null}
    </div>
  );
}

function BasicsStep({
  professionalId,
  values,
  onSaved,
}: {
  professionalId: Id<"professionals">;
  values: BasicsValues;
  onSaved: (values: BasicsValues) => void;
}) {
  const updateBasics = useMutation(api.professionalOwnership.updateProfessionalBasics);

  const [displayName, setDisplayName] = React.useState(values.displayName);
  const [kind, setKind] = React.useState<ProfessionalKind>(values.kind);
  const [firmName, setFirmName] = React.useState(values.firmName);
  const [bio, setBio] = React.useState(values.bio);
  const [remoteServices, setRemoteServices] = React.useState(values.remoteServices);
  const [inPersonServices, setInPersonServices] = React.useState(values.inPersonServices);
  const [publicContactMode, setPublicContactMode] = React.useState<ContactMode>(
    values.publicContactMode,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateBasics({
        professionalId,
        displayName,
        kind,
        firmName: firmName.trim() ? firmName.trim() : undefined,
        bio,
        remoteServices,
        inPersonServices,
        publicContactMode,
      });
      onSaved({
        displayName,
        kind,
        firmName,
        bio,
        remoteServices,
        inPersonServices,
        publicContactMode,
      });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not save your basics.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="basics-display-name" className="text-caption font-medium text-slate">
          Display name
        </label>
        <input
          id="basics-display-name"
          type="text"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
        />
      </div>

      {kind === "firm" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="basics-firm-name" className="text-caption font-medium text-slate">
            Firm name
          </label>
          <input
            id="basics-firm-name"
            type="text"
            value={firmName}
            onChange={(event) => setFirmName(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="basics-bio" className="text-caption font-medium text-slate">
          Bio
        </label>
        <textarea
          id="basics-bio"
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="rounded-input border border-control bg-white px-3 py-2 text-compact text-navy"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-compact text-navy">
          <input
            type="checkbox"
            checked={remoteServices}
            onChange={(event) => setRemoteServices(event.target.checked)}
          />
          Offers remote services
        </label>
        <label className="flex items-center gap-2 text-compact text-navy">
          <input
            type="checkbox"
            checked={inPersonServices}
            onChange={(event) => setInPersonServices(event.target.checked)}
          />
          Offers in-person services
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="basics-contact-mode" className="text-caption font-medium text-slate">
          Public contact mode
        </label>
        <select
          id="basics-contact-mode"
          value={publicContactMode}
          onChange={(event) => setPublicContactMode(event.target.value as ContactMode)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
        >
          <option value="contact_form">Contact form</option>
          <option value="external">External link</option>
          <option value="none">None</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : "Next"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}

function ServicesStep({
  professionalId,
  countries,
  serviceCategories,
  entries,
  onBack,
  onSaved,
}: {
  professionalId: Id<"professionals">;
  countries: CountryRow[] | undefined;
  serviceCategories: ServiceCategoryRow[] | undefined;
  entries: ServiceEntry[];
  onBack: () => void;
  onSaved: (entries: ServiceEntry[]) => void;
}) {
  const setServices = useMutation(api.professionalOwnership.setProfessionalServices);

  const [list, setList] = React.useState<ServiceEntry[]>(entries);
  const [countryId, setCountryId] = React.useState<Id<"countries"> | "">("");
  const jurisdictions = useQuery(
    api.taxonomy.listTaxJurisdictions,
    countryId ? { countryId } : "skip",
  );
  const [jurisdictionId, setJurisdictionId] = React.useState<Id<"taxJurisdictions"> | "">("");
  const [serviceId, setServiceId] = React.useState<Id<"serviceCategories"> | "">("");
  const [remote, setRemote] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleAdd() {
    if (!jurisdictionId || !serviceId) return;
    const jurisdiction = jurisdictions?.find((row) => row.jurisdictionId === jurisdictionId);
    const service = serviceCategories?.find((row) => row.serviceId === serviceId);
    if (!jurisdiction || !service) return;

    setList((current) => [
      ...current,
      {
        key: `${serviceId}-${jurisdictionId}-${current.length}`,
        serviceId,
        serviceName: service.name,
        taxJurisdictionId: jurisdictionId,
        jurisdictionLabel: jurisdiction.label,
        remote,
        description: description.trim() ? description.trim() : undefined,
      },
    ]);
    setServiceId("");
    setDescription("");
  }

  function handleRemove(key: string) {
    setList((current) => current.filter((entry) => entry.key !== key));
  }

  async function handleNext() {
    setError(null);
    setSubmitting(true);
    try {
      await setServices({
        professionalId,
        services: list.map((entry) => ({
          serviceId: entry.serviceId,
          taxJurisdictionId: entry.taxJurisdictionId,
          remote: entry.remote,
          description: entry.description,
        })),
      });
      onSaved(list);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not save your services.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-input border border-border bg-subtle p-4">
        <p className="text-caption font-medium text-slate">Add a service offering</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={countryId}
            onChange={(event) => {
              setCountryId(event.target.value as Id<"countries">);
              setJurisdictionId("");
            }}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          >
            <option value="">Jurisdiction's country…</option>
            {countries?.map((country) => (
              <option key={country.countryId} value={country.countryId}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            value={jurisdictionId}
            disabled={!countryId}
            onChange={(event) => setJurisdictionId(event.target.value as Id<"taxJurisdictions">)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy disabled:opacity-50"
          >
            <option value="">Tax jurisdiction…</option>
            {jurisdictions?.map((jurisdiction) => (
              <option key={jurisdiction.jurisdictionId} value={jurisdiction.jurisdictionId}>
                {jurisdiction.label}
              </option>
            ))}
          </select>
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value as Id<"serviceCategories">)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          >
            <option value="">Service category…</option>
            {serviceCategories?.map((service) => (
              <option key={service.serviceId} value={service.serviceId}>
                {service.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-compact text-navy">
            <input
              type="checkbox"
              checked={remote}
              onChange={(event) => setRemote(event.target.checked)}
            />
            Offered remotely
          </label>
        </div>
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description"
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={!jurisdictionId || !serviceId}
          onClick={handleAdd}
        >
          Add service
        </Button>
      </div>

      {list.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {list.map((entry) => (
            <li
              key={entry.key}
              className="flex items-center justify-between gap-3 rounded-input border border-border bg-white p-3"
            >
              <span className="text-compact text-navy">
                {entry.serviceName} — {entry.jurisdictionLabel}
                {entry.remote ? " (remote)" : ""}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.key)}
                className="text-slate hover:text-danger"
                aria-label={`Remove ${entry.serviceName}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-slate/70">No services added yet.</p>
      )}

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="button" disabled={submitting} onClick={handleNext}>
          {submitting ? "Saving…" : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function LocationsStep({
  professionalId,
  countries,
  entries,
  onBack,
  onSaved,
}: {
  professionalId: Id<"professionals">;
  countries: CountryRow[] | undefined;
  entries: LocationEntry[];
  onBack: () => void;
  onSaved: (entries: LocationEntry[]) => void;
}) {
  const setLocations = useMutation(api.professionalOwnership.setProfessionalLocations);

  const [list, setList] = React.useState<LocationEntry[]>(entries);
  const [countryId, setCountryId] = React.useState<Id<"countries"> | "">("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [publicLocationText, setPublicLocationText] = React.useState("");
  const [isPrimary, setIsPrimary] = React.useState(list.length === 0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleAdd() {
    if (!countryId || !city.trim()) return;
    const country = countries?.find((row) => row.countryId === countryId);
    if (!country) return;

    setList((current) => [
      ...current,
      {
        key: `${countryId}-${city}-${current.length}`,
        countryId,
        countryName: country.name,
        city: city.trim(),
        region: region.trim() ? region.trim() : undefined,
        publicLocationText: publicLocationText.trim() ? publicLocationText.trim() : undefined,
        isPrimary,
      },
    ]);
    setCity("");
    setRegion("");
    setPublicLocationText("");
    setIsPrimary(false);
  }

  function handleRemove(key: string) {
    setList((current) => current.filter((entry) => entry.key !== key));
  }

  async function handleNext() {
    setError(null);
    setSubmitting(true);
    try {
      await setLocations({
        professionalId,
        locations: list.map((entry) => ({
          countryId: entry.countryId,
          city: entry.city,
          region: entry.region,
          publicLocationText: entry.publicLocationText,
          isPrimary: entry.isPrimary,
        })),
      });
      onSaved(list);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not save your locations.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-input border border-border bg-subtle p-4">
        <p className="text-caption font-medium text-slate">Add a location</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={countryId}
            onChange={(event) => setCountryId(event.target.value as Id<"countries">)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          >
            <option value="">Country…</option>
            {countries?.map((country) => (
              <option key={country.countryId} value={country.countryId}>
                {country.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
          <input
            type="text"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            placeholder="Region/state (optional)"
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
          <input
            type="text"
            value={publicLocationText}
            onChange={(event) => setPublicLocationText(event.target.value)}
            placeholder="Public location text (optional)"
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
        </div>
        <label className="flex items-center gap-2 text-compact text-navy">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
          />
          Primary location
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={!countryId || !city.trim()}
          onClick={handleAdd}
        >
          Add location
        </Button>
      </div>

      {list.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {list.map((entry) => (
            <li
              key={entry.key}
              className="flex items-center justify-between gap-3 rounded-input border border-border bg-white p-3"
            >
              <span className="flex items-center gap-2 text-compact text-navy">
                <MapPin className="h-3.5 w-3.5 text-slate" aria-hidden />
                {entry.city}, {entry.countryName}
                {entry.isPrimary ? " (primary)" : ""}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.key)}
                className="text-slate hover:text-danger"
                aria-label={`Remove ${entry.city}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-slate/70">No locations added yet.</p>
      )}

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="button" disabled={submitting} onClick={handleNext}>
          {submitting ? "Saving…" : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function LanguagesStep({
  professionalId,
  options,
  selected,
  onBack,
  onSaved,
}: {
  professionalId: Id<"professionals">;
  options: LanguageRow[] | undefined;
  selected: LanguageRow[];
  onBack: () => void;
  onSaved: (selected: LanguageRow[]) => void;
}) {
  const setLanguages = useMutation(api.professionalOwnership.setProfessionalLanguages);

  const [selectedIds, setSelectedIds] = React.useState<Set<Id<"languages">>>(
    new Set(selected.map((row) => row.languageId)),
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggle(languageId: Id<"languages">) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(languageId)) {
        next.delete(languageId);
      } else {
        next.add(languageId);
      }
      return next;
    });
  }

  async function handleNext() {
    setError(null);
    setSubmitting(true);
    try {
      const languageIds = Array.from(selectedIds);
      await setLanguages({ professionalId, languageIds });
      const saved = (options ?? []).filter((row) => selectedIds.has(row.languageId));
      onSaved(saved);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not save your languages.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 text-caption font-medium text-slate">
        <LanguagesIcon className="h-4 w-4" aria-hidden />
        Languages you advise in
      </p>
      {options === undefined ? (
        <p className="text-compact text-slate">Loading languages…</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {options.map((language) => (
            <label
              key={language.languageId}
              className="flex items-center gap-2 rounded-input border border-control bg-white px-3 py-2 text-compact text-navy"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(language.languageId)}
                onChange={() => toggle(language.languageId)}
              />
              {language.label}
            </label>
          ))}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="button" disabled={submitting} onClick={handleNext}>
          {submitting ? "Saving…" : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function CredentialsStep({
  professionalId,
  countries,
  entries,
  onChange,
  onBack,
  onNext,
}: {
  professionalId: Id<"professionals">;
  countries: CountryRow[] | undefined;
  entries: CredentialEntry[];
  onChange: (entries: CredentialEntry[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const addCredential = useMutation(api.professionalOwnership.addPublicCredential);
  const removeCredential = useMutation(api.professionalOwnership.removePublicCredential);

  const [designation, setDesignation] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [countryId, setCountryId] = React.useState<Id<"countries"> | "">("");
  const jurisdictions = useQuery(
    api.taxonomy.listTaxJurisdictions,
    countryId ? { countryId } : "skip",
  );
  const [jurisdictionId, setJurisdictionId] = React.useState<Id<"taxJurisdictions"> | "">("");
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<Id<"professionalPublicCredentials"> | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd() {
    if (!designation.trim()) return;
    setError(null);
    setAdding(true);
    try {
      const jurisdiction = jurisdictions?.find((row) => row.jurisdictionId === jurisdictionId);
      const { credentialId } = await addCredential({
        professionalId,
        designation: designation.trim(),
        issuer: issuer.trim() ? issuer.trim() : undefined,
        jurisdictionId: jurisdictionId || undefined,
      });
      onChange([
        ...entries,
        {
          credentialId,
          designation: designation.trim(),
          issuer: issuer.trim() ? issuer.trim() : undefined,
          jurisdictionLabel: jurisdiction?.label,
        },
      ]);
      setDesignation("");
      setIssuer("");
      setJurisdictionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that credential.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(credentialId: Id<"professionalPublicCredentials">) {
    setError(null);
    setRemovingId(credentialId);
    try {
      await removeCredential({ credentialId });
      onChange(entries.filter((entry) => entry.credentialId !== credentialId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that credential.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-input border border-border bg-subtle p-4">
        <p className="flex items-center gap-2 text-caption font-medium text-slate">
          <BadgeCheck className="h-4 w-4" aria-hidden />
          Add a declared credential (optional) — shown as unverified until staff review it
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={designation}
            onChange={(event) => setDesignation(event.target.value)}
            placeholder="Designation, e.g. CPA"
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
          <input
            type="text"
            value={issuer}
            onChange={(event) => setIssuer(event.target.value)}
            placeholder="Issuer (optional)"
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          />
          <select
            value={countryId}
            onChange={(event) => {
              setCountryId(event.target.value as Id<"countries">);
              setJurisdictionId("");
            }}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy"
          >
            <option value="">Jurisdiction's country (optional)…</option>
            {countries?.map((country) => (
              <option key={country.countryId} value={country.countryId}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            value={jurisdictionId}
            disabled={!countryId}
            onChange={(event) => setJurisdictionId(event.target.value as Id<"taxJurisdictions">)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy disabled:opacity-50"
          >
            <option value="">Tax jurisdiction (optional)…</option>
            {jurisdictions?.map((jurisdiction) => (
              <option key={jurisdiction.jurisdictionId} value={jurisdiction.jurisdictionId}>
                {jurisdiction.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={!designation.trim() || adding}
          onClick={handleAdd}
        >
          {adding ? "Adding…" : "Add credential"}
        </Button>
      </div>

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.credentialId}
              className="flex items-center justify-between gap-3 rounded-input border border-border bg-white p-3"
            >
              <span className="text-compact text-navy">
                {entry.designation}
                {entry.issuer ? ` — ${entry.issuer}` : ""}
                {entry.jurisdictionLabel ? ` (${entry.jurisdictionLabel})` : ""}
              </span>
              <button
                type="button"
                disabled={removingId === entry.credentialId}
                onClick={() => handleRemove(entry.credentialId)}
                className="text-slate hover:text-danger"
                aria-label={`Remove ${entry.designation}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-slate/70">No credentials added yet — this step is optional.</p>
      )}

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Next
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  professionalId,
  basics,
  services,
  locations,
  languages,
  credentials,
  onBack,
  onSubmitted,
}: {
  professionalId: Id<"professionals">;
  basics: BasicsValues;
  services: ServiceEntry[];
  locations: LocationEntry[];
  languages: LanguageRow[];
  credentials: CredentialEntry[];
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const submitForReview = useMutation(api.professionalOwnership.submitForReview);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await submitForReview({ professionalId });
      onSubmitted();
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not submit your listing for review.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-input border border-border bg-white p-4">
        <div>
          <p className="text-caption font-medium text-slate">Basics</p>
          <p className="text-compact text-navy">
            {basics.displayName} ({basics.kind}
            {basics.firmName ? `, ${basics.firmName}` : ""})
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-caption font-medium text-slate">
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            Services ({services.length})
          </p>
          {services.length === 0 ? (
            <p className="text-compact text-slate/70">None added</p>
          ) : (
            <ul className="list-inside list-disc text-compact text-navy">
              {services.map((entry) => (
                <li key={entry.key}>
                  {entry.serviceName} — {entry.jurisdictionLabel}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-caption font-medium text-slate">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Locations ({locations.length})
          </p>
          {locations.length === 0 ? (
            <p className="text-compact text-slate/70">None added</p>
          ) : (
            <ul className="list-inside list-disc text-compact text-navy">
              {locations.map((entry) => (
                <li key={entry.key}>
                  {entry.city}, {entry.countryName}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-caption font-medium text-slate">Languages ({languages.length})</p>
          <p className="text-compact text-navy">
            {languages.length === 0 ? "None selected" : languages.map((row) => row.label).join(", ")}
          </p>
        </div>
        <div>
          <p className="text-caption font-medium text-slate">Credentials ({credentials.length})</p>
          <p className="text-compact text-navy">
            {credentials.length === 0
              ? "None added"
              : credentials.map((row) => row.designation).join(", ")}
          </p>
        </div>
      </div>

      {services.length === 0 && locations.length === 0 ? (
        <p role="alert" className="text-caption font-medium text-danger">
          At least one service or location is required before you can submit for review.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button
          type="button"
          disabled={submitting || (services.length === 0 && locations.length === 0)}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Submit for review"}
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
