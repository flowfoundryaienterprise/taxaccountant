import { AlertTriangle, Check, HelpCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  UNIVERSAL_SERVICE_LIMITATION,
  type ServiceCatalogEntry,
} from "@/lib/marketplace/services";

/**
 * "About the service": what the work covers, who it suits, and the
 * jurisdiction limits.
 *
 * The limitations block is not optional styling — every service page has to
 * carry it (DESIGN.md section 13: country and tax guidance needs review;
 * AGENTS.md: never imply universal availability or authorization). The
 * universal limitation is appended by this component so no individual
 * service entry can forget it.
 */
export function ServiceBenefits({ service }: { service: ServiceCatalogEntry }) {
  const limitations = [...service.limitations, UNIVERSAL_SERVICE_LIMITATION];

  return (
    <section id="about" className="py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="About the service"
          title={`What ${service.title.toLowerCase()} generally covers`}
        />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col gap-4">
            {service.about.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="max-w-[72ch] text-body text-slate">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-panel border border-border bg-white p-6">
              <h3 className="flex items-center gap-2 text-compact font-semibold text-navy">
                <HelpCircle className="h-4 w-4 text-action" aria-hidden />
                Who may benefit
              </h3>
              <ul className="flex flex-col gap-2.5">
                {service.whoBenefits.map((item) => (
                  <li key={item} className="flex gap-2.5 text-compact text-slate">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4 rounded-panel border border-warning/30 bg-warning/5 p-6">
              <h3 className="flex items-center gap-2 text-compact font-semibold text-navy">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
                Jurisdiction limits to be aware of
              </h3>
              <ul className="flex flex-col gap-2.5">
                {limitations.map((item) => (
                  <li key={item.slice(0, 40)} className="text-compact text-slate">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
