import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { services } from "@/lib/home-content";

export function ServicesSection() {
  return (
    <section id="services" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Services"
          title="Every service, matched to the right jurisdiction"
          description="Pick a category to start a search filtered to professionals who cover it."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <Reveal key={service.slug} delayMs={index * 60}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
