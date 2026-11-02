"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { CheckCircle2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONSENT_VERSION } from "@/lib/legal/consent";
import { api } from "@/convex/_generated/api";

interface EnquiryFormProps {
  kind: "contact" | "professional_interest";
  /** Shown once the submission succeeds, in place of the form. */
  successTitle: string;
  successBody: string;
}

/**
 * Shared contact / professional-interest form (PRD.md P1-F08).
 *
 * This is a **real** submission, not a disabled preview — `publicMessages`
 * already existed in the schema with nowhere to write to it, and a Phase 1
 * public contact form is explicitly in scope (unlike CMS writes, which stay
 * disabled because that backend genuinely does not exist). See
 * `convex/contact.ts` for what server-side validation and anti-abuse
 * measures exist, and what is deliberately still missing (per-sender rate
 * limiting).
 *
 * Exactly the fields `publicMessages` models: name, email, optional phone,
 * optional subject, message, consent. No tax identifiers, no file upload —
 * out of scope for a public form by design (AGENTS.md section 1).
 */
export function EnquiryForm({ kind, successTitle, successBody }: EnquiryFormProps) {
  const pathname = usePathname();
  const submit = useMutation(api.contact.submitPublicMessage);
  // `useState`'s lazy initializer, not `useRef(Date.now())` — a ref's
  // initial-value argument is still evaluated on every render even though
  // only the first call is kept, which React's purity rule (impure calls
  // during render) correctly flags. The functional form of `useState` is
  // the sanctioned escape hatch for a one-time impure read at mount.
  const [mountedAt] = React.useState(() => Date.now());

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [consented, setConsented] = React.useState(false);
  const [companyWebsite, setCompanyWebsite] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consented) {
      setError("Please acknowledge the privacy notice to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submit({
        kind,
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
        consentVersion: CONSENT_VERSION,
        sourcePath: pathname,
        companyWebsite,
        elapsedMs: Date.now() - mountedAt,
      });
      setSucceeded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-panel border border-success/30 bg-white p-6">
        <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />
        <h3 className="text-compact font-semibold text-navy">{successTitle}</h3>
        <p className="max-w-[60ch] text-compact text-slate">{successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Honeypot: visually and semantically hidden from a real visitor, a
          form-filling bot typically fills every input it finds. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="company-website">Leave this field blank</label>
        <input
          id="company-website"
          name="company-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={companyWebsite}
          onChange={(event) => setCompanyWebsite(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-name" className="text-caption font-medium text-slate">
            Name<span className="text-danger"> *</span>
          </label>
          <input
            id="enquiry-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-email" className="text-caption font-medium text-slate">
            Email<span className="text-danger"> *</span>
          </label>
          <input
            id="enquiry-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-phone" className="text-caption font-medium text-slate">
            Phone <span className="text-slate/70">(optional)</span>
          </label>
          <input
            id="enquiry-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={40}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="enquiry-subject" className="text-caption font-medium text-slate">
            Subject <span className="text-slate/70">(optional)</span>
          </label>
          <input
            id="enquiry-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={200}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="enquiry-message" className="text-caption font-medium text-slate">
          Message<span className="text-danger"> *</span>
        </label>
        <textarea
          id="enquiry-message"
          required
          rows={5}
          minLength={10}
          maxLength={4000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Do not include tax ID numbers, account numbers, or tax documents here."
          className="rounded-input border border-control bg-white px-3 py-2.5 text-compact text-navy placeholder:text-slate/70 transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <label className="flex items-start gap-2.5 text-caption text-slate">
        <input
          type="checkbox"
          required
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-action"
        />
        <span>
          I understand this message is reviewed by TaxAccountant.com staff and agree to the{" "}
          <a href="/privacy" className="font-medium text-action hover:underline">
            privacy notice
          </a>
          . I will not include tax ID numbers, account numbers, or tax documents.
        </span>
      </label>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-fit">
        <Send className="h-4 w-4" aria-hidden />
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
