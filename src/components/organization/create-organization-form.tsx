"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

type OrganizationKind = "customer_business" | "professional_firm";

const KIND_OPTIONS: Array<{ value: OrganizationKind; label: string; description: string }> = [
  {
    value: "customer_business",
    label: "Business",
    description: "A business looking for tax and accounting help.",
  },
  {
    value: "professional_firm",
    label: "Professional firm",
    description: "An accounting or tax firm that will manage clients here.",
  },
];

/**
 * Creates a new organization (`api.organizations.createOrganization`) and
 * redirects the caller to its detail page on success.
 *
 * Follows `src/components/shared/account-auth-form.tsx`'s established
 * conventions rather than inventing a new form pattern: controlled inputs,
 * a single `submitting` flag disabling the submit button, and an inline
 * `<p role="alert">` for the error message. The caller's identity for
 * ownership comes from `ctx.auth` inside the mutation itself
 * (`convex/organizations.ts`), never a client-supplied id — this form only
 * ever sends `name`/`kind`.
 */
export function CreateOrganizationForm() {
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.createOrganization);

  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<OrganizationKind>("customer_business");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { organizationId } = await createOrganization({ name, kind });
      router.push(`/organization/${organizationId}`);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Could not create the organization. Try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="organization-name" className="text-caption font-medium text-slate">
          Organization name
        </label>
        <input
          id="organization-name"
          type="text"
          autoComplete="organization"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-caption font-medium text-slate">Organization type</legend>
        {KIND_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-input border border-control bg-white p-3 transition-colors duration-150 hover:border-action"
          >
            <input
              type="radio"
              name="organization-kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
              className="mt-1"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-compact font-medium text-navy">{option.label}</span>
              <span className="text-caption text-slate">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <Building2 className="h-4 w-4" aria-hidden />
        {submitting ? "Creating organization…" : "Create organization"}
      </Button>
    </form>
  );
}
