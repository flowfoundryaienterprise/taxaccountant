"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { howItWorksSteps } from "@/lib/home-content";

/**
 * Four steps, set as a numbered sequence rather than four bordered cards —
 * kept from the original pass, which already rejected the generic
 * tinted-icon-tile grid. What changed: the step numeral is now oversized
 * ghost type (the hero's own device) and the row springs in on scroll
 * instead of a flat fade.
 */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, and what each one can actually do"
          description="Direct booking and messaging arrive in a later phase. These are the steps that work today."
        />

        <motion.ol
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
          className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {howItWorksSteps.map((step) => (
            <motion.li key={step.step} variants={item} className="relative flex flex-col gap-2 pt-2">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 left-0 select-none font-mono text-6xl font-semibold leading-none tracking-tighter text-navy/10"
              >
                {String(step.step).padStart(2, "0")}
              </span>
              <span className="relative border-t border-navy/20 pt-4 text-caption">
                <span className="sr-only">Step </span>
                <span className="font-mono tabular-nums text-slate">
                  {String(step.step).padStart(2, "0")}
                </span>
              </span>
              <h3 className="relative text-compact font-medium text-navy">{step.title}</h3>
              <p className="relative text-compact text-slate">{step.description}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}
