import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { services } from "@/lib/home-content";
import { serviceHref } from "@/lib/marketplace/query-params";

export function ServicesSection() {
  return (
    <section id="services" className="editorial-services">
      <Container className="editorial-services-grid">
        <div className="editorial-services-intro">
          <h2>Expertise for the details that matter.</h2>
          <p>From an annual return to decisions across borders, find the right kind of support.</p>
          <Link href="/services">Explore all services <ArrowUpRight size={17} aria-hidden /></Link>
        </div>
        <div className="editorial-service-list">
          {services.map((service, index) => (
            <Reveal key={service.slug} delayMs={index * 60} className="editorial-service-row">
              <Link href={serviceHref(service.slug)} key={service.slug} className="editorial-service-row-link">
                <span>
                  <strong>{service.title}</strong>
                  <small>{service.description}</small>
                </span>
                <ArrowUpRight size={20} aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
