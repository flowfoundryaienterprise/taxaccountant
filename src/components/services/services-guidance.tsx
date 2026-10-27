import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Filter,
  Globe2,
  MapPinned,
  MessageSquareText,
  Scale,
  Search,
  UserRound,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { directoryHref, serviceHref } from "@/lib/marketplace/query-params";
import { servicesForAudience } from "@/lib/marketplace/services";

/* ------------------------------------------------------------------ */
/* How to choose the right service                                     */
/* ------------------------------------------------------------------ */

const choosingSteps = [
  {
    icon: ClipboardList,
    title: "Start from the work, not the title",
    description:
      "Decide whether you need something filed, something kept up to date, or a view on a decision you have not made yet. Those are three different engagements.",
  },
  {
    icon: MapPinned,
    title: "Identify every jurisdiction involved",
    description:
      "List the tax authorities that have a claim on you or your business. More than one is common, and each may need its own authorized professional.",
  },
  {
    icon: Scale,
    title: "Check authorization, not location",
    description:
      "A professional based near you is not necessarily authorized where you file. Ask directly, and filter by tax jurisdiction rather than by country.",
  },
  {
    icon: MessageSquareText,
    title: "Agree scope before the work starts",
    description:
      "Confirm what is included, what is handed back to you, who deals with the authority, and what falls outside the engagement.",
  },
];

export function ChoosingGuide() {
  return (
    <section id="choosing" className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Choosing a service"
          title="How to choose the right service"
          description="Four things worth settling before you contact anyone. None of this is advice about your own tax position — it is how to narrow a search."
        />

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {choosingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-card border border-border bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-caption font-semibold text-white">
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4 text-action" aria-hidden />
                </div>
                <h3 className="text-compact font-semibold text-navy">{step.title}</h3>
                <p className="text-compact text-slate">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Individual versus business services                                 */
/* ------------------------------------------------------------------ */

const audiences = [
  {
    key: "individual" as const,
    icon: UserRound,
    title: "For individuals",
    description:
      "Work that attaches to a person: an annual return, income from more than one source, a change of residence, or a correction to something already filed.",
  },
  {
    key: "business" as const,
    icon: Building2,
    title: "For businesses",
    description:
      "Work that attaches to an entity: periodic filings, indirect tax, employing people, and keeping records in a state the filings can be prepared from.",
  },
];

export function AudienceSplit() {
  return (
    <section id="individual-vs-business" className="bg-tint/50 py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Individual or business"
          title="Individual versus business services"
          description="Several categories appear on both sides. The difference is who the obligation belongs to — a person or an entity — not the name of the service."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            const list = servicesForAudience(audience.key);

            return (
              <div
                key={audience.key}
                className="flex flex-col gap-5 rounded-panel border border-border bg-white p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-tint text-action">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-heading-sm font-semibold text-navy">{audience.title}</h3>
                    <p className="text-compact text-slate">{audience.description}</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-1">
                  {list.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={serviceHref(service.slug)}
                        className="group flex items-center justify-between gap-3 rounded-input px-3 py-2.5 text-compact text-navy transition-colors duration-150 hover:bg-tint"
                      >
                        <span className="min-w-0">{service.title}</span>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 text-action transition-transform duration-150 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* International and cross-border considerations                       */
/* ------------------------------------------------------------------ */

const crossBorderPoints = [
  "More than one jurisdiction can have a claim on the same income, entity or person, through residence, source, establishment or ownership.",
  "A reporting obligation can exist in a jurisdiction even where no tax is ultimately payable there.",
  "Whether a treaty applies, and what it provides, depends on the specific pair of jurisdictions and on the facts.",
  "Cross-border work often needs authorized professionals on more than one side rather than a single adviser.",
];

export function CrossBorderNote() {
  return (
    <section id="cross-border" className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Cross-border"
            title="International and cross-border considerations"
            description="If more than one country is involved, the question stops being which service you need and starts being which jurisdictions are in scope."
          />

          <Link
            href={serviceHref("international-tax-services")}
            className="group inline-flex w-fit items-center gap-1.5 text-compact font-semibold text-action"
          >
            Read about international tax services
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <ul className="flex flex-col gap-3">
          {crossBorderPoints.map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-card border border-border bg-white px-5 py-4 text-compact text-slate"
            >
              <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How discovery works                                                 */
/* ------------------------------------------------------------------ */

const discoverySteps = [
  {
    icon: Search,
    title: "Pick a service and a jurisdiction",
    description:
      "Start from the category of work and the tax authority involved. Both carry through the search as URL filters you can share.",
  },
  {
    icon: Filter,
    title: "Narrow the directory",
    description:
      "Filter by country, city, tax jurisdiction, language and consultation mode. Country and jurisdiction are separate filters and never imply each other.",
  },
  {
    icon: MessageSquareText,
    title: "Contact a professional directly",
    description:
      "Confirm authorization, scope and fees with them. TaxAccountant.com does not quote, book, take payment or give advice.",
  },
];

export function DiscoverySteps() {
  return (
    <section id="how-discovery-works" className="bg-tint/50 py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="How it works"
          title="How discovery works on TaxAccountant.com"
          description="This is a discovery platform. Its job ends when you have found a professional worth contacting."
        />

        <div className="grid gap-5 sm:grid-cols-3">
          {discoverySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-card border border-border bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-caption font-semibold text-action">
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4 text-action" aria-hidden />
                </div>
                <h3 className="text-compact font-semibold text-navy">{step.title}</h3>
                <p className="text-compact text-slate">{step.description}</p>
              </div>
            );
          })}
        </div>

        <Link
          href={directoryHref()}
          className="group inline-flex w-fit items-center gap-1.5 text-compact font-semibold text-action"
        >
          Open the directory
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </Container>
    </section>
  );
}
