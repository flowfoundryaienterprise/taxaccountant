import { CircleHelp, Dot } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ServiceCatalogEntry } from "@/lib/marketplace/services";

/**
 * "Common needs": the situations this category of work usually covers, plus
 * questions worth asking a professional.
 *
 * The questions are deliberately questions — not answers. Answering them
 * would be giving advice on a reader's circumstances, which this platform
 * does not do.
 */
export function ServiceNeeds({ service }: { service: ServiceCatalogEntry }) {
  return (
    <section id="common-needs" className="bg-tint/50 py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Common needs"
          title="Situations this service usually covers"
          description="Typical reasons people look for this work. Scope is agreed with the professional you engage — not set by this platform."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {service.commonNeeds.map((need) => (
            <div
              key={need.title}
              className="flex flex-col gap-2 rounded-card border border-border bg-white p-6"
            >
              <h3 className="text-compact font-semibold text-navy">{need.title}</h3>
              <p className="text-compact text-slate">{need.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-panel border border-border bg-white p-6 sm:p-8">
          <h3 className="flex items-center gap-2 text-heading-sm font-semibold text-navy">
            <CircleHelp className="h-5 w-5 text-action" aria-hidden />
            Questions worth asking
          </h3>
          <p className="max-w-[72ch] text-compact text-slate">
            Ask these of any professional you contact. TaxAccountant.com cannot answer them for a
            specific professional or a specific situation.
          </p>
          <ul className="flex flex-col gap-2">
            {service.questionsToAsk.map((question) => (
              <li key={question} className="flex gap-1.5 text-compact text-navy">
                <Dot className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
