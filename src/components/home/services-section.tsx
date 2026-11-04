import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { services } from "@/lib/home-content";
export function ServicesSection() {
  return <section id="services" className="py-12"><Container className="flex flex-col gap-7">
    <SectionHeading eyebrow="Our services" title="The expertise you need. All in one place." description="Explore support for every stage of your financial life." />
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{services.map(service => <ServiceCard key={service.slug} service={service} highlighted={service.slug === "business-tax-services"} className="h-full" />)}</div>
  </Container></section>;
}
