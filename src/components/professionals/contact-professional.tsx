import Link from "next/link";
import { ArrowRight, MailWarning, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { directoryHref } from "@/lib/marketplace/query-params";
import {
  jurisdictionCodes,
  locationCountryCodes,
  profileName,
} from "@/lib/professionals/profile-formatters";
import type { ProfessionalProfile } from "@/lib/professionals/profile-types";
import { cn } from "@/lib/utils";

/**
 * Contact section.
 *
 * Branches on `professionals.publicContactMode`, which is the field that
 * decides whether a contact route exists for a given profile:
 *
 *  - `"none"` — the state every profile is in today. No Phase 1 contact
 *    workflow has been built (`contact:submit` plus a contact route, API.md
 *    sections 2-3), so the section says so and offers the routes that do
 *    work. It never renders a dead button and never simulates a delivered
 *    enquiry.
 *  - `"contact_form"` / `"external"` — wired to the real destination once one
 *    exists. The component is written for both so the swap is a data change,
 *    not a rewrite.
 *
 * No form is rendered here in either case, and when one is added it must
 * never collect tax identifiers, banking details or tax documents — a public
 * contact form is not a secure document channel (Day 5 brief section 10;
 * PRD/AGENTS data-handling rules).
 */
export function ContactProfessional({ profile }: { profile: ProfessionalProfile }) {
  const name = profileName(profile);
  const country = locationCountryCodes(profile)[0];
  const jurisdictions = jurisdictionCodes(profile);

  const available = profile.publicContactMode !== "none";

  return (
    <section id="contact" className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col items-start gap-6 rounded-panel bg-navy px-6 py-12 text-white sm:px-12">
          <div className="flex max-w-[58ch] flex-col gap-3">
            <h2 className="text-heading-lg font-semibold">
              Need help with your tax or accounting requirements?
            </h2>
            <p className="text-lead text-white/80">
              Explore this professional&rsquo;s services and contact options to determine whether
              they can assist with your needs.
            </p>
          </div>

          {available ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/contact?professional=${profile.slug}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group h-auto max-w-full whitespace-normal py-3 text-left transition-transform duration-150",
                )}
              >
                Contact {name}
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          ) : (
            /*
             * The honest availability message the brief asks for in place of
             * a non-functional button. It states the position, says what to
             * do instead, and offers two links that genuinely work.
             */
            <div className="flex max-w-[72ch] flex-col gap-4 rounded-card border border-white/20 bg-white/5 p-5">
              <p className="flex items-start gap-2 text-compact text-white/90">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden />
                <span>
                  <strong className="font-semibold text-white">
                    No contact channel is enabled for this profile yet.
                  </strong>{" "}
                  Messaging through TaxAccountant.com has not launched, so this page does not offer
                  a contact form or a direct address. Rather than take a message that could not be
                  delivered, it says so here.
                </span>
              </p>

              <p className="text-compact text-white/80">
                In the meantime, the directory is the practical route: it filters by tax
                jurisdiction, service and language, so you can shortlist professionals and approach
                them through their own published channels.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={directoryHref(
                    jurisdictions.length ? { jurisdiction: jurisdictions[0] } : { country },
                  )}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group h-auto max-w-full whitespace-normal py-3 text-left transition-transform duration-150",
                  )}
                >
                  Find professionals for this tax jurisdiction
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/services"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "border border-white/30 text-white hover:bg-white/10",
                  )}
                >
                  Browse services
                </Link>
              </div>
            </div>
          )}

          <p className="flex max-w-[76ch] items-start gap-2 text-caption text-white/70">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Never send tax identification numbers, banking details or tax documents through a
              public contact channel. Confirm authorization for your tax jurisdiction, the scope of
              the work and the fee directly with any professional before engaging them.
            </span>
          </p>
        </div>
      </Container>
    </section>
  );
}
