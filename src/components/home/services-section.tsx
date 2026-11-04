"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { services } from "@/lib/home-content";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 110, damping: 20 } },
};

/**
 * Flat 4-up grid, one category highlighted in navy — matching the approved
 * mockup's "all services at a glance" layout. `ServiceCard` itself is
 * untouched apart from its new `highlighted` variant (shared with
 * `/services`) — only the grid wrapper composing it changed.
 */
export function ServicesSection() {
  return (
    <section id="services" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Our services"
          title="The expertise you need. All in one place."
          description="Explore support for every stage of your financial life."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((service) => (
            <motion.div key={service.slug} variants={item}>
              <ServiceCard
                service={service}
                highlighted={service.slug === "business-tax-services"}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
