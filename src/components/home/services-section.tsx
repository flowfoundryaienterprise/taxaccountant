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
 * Bento-style asymmetric grid: the first category spans two tracks instead
 * of the previous flat 4-up row, which the design-taste-frontend-v1 pass
 * singles out as the generic "equal cards in a row" tell. `ServiceCard`
 * itself is untouched (shared with /services) — only the grid wrapper
 * composing it changed.
 */
export function ServicesSection() {
  return (
    <section id="services" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Services"
          title="Every service, matched to the right jurisdiction"
          description="Pick a category to read what the work involves, then filter the directory to professionals who cover it."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.slug}
              variants={item}
              className={index === 0 ? "lg:col-span-2" : undefined}
            >
              {/*
                Wide, not tall: a two-column span reads as a deliberate lead
                item at the card's normal height. Spanning rows too left a
                tall box with nothing to fill it — one line of description
                and a CTA pinned to the bottom by `mt-auto`, a large dead gap
                between them. Content decides height, not the grid.
              */}
              <ServiceCard service={service} className="h-full" />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
