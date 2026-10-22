import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { howItWorksSteps } from "@/lib/home-content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-tint py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Get Expert Help in 4 Simple Steps"
          description="From search to filing, we make it easy to connect with the right tax professional."
          className="mx-auto"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === howItWorksSteps.length - 1;
            return (
              <Reveal key={step.step} delayMs={index * 90}>
                <div className="relative flex h-full flex-col gap-3 rounded-card border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_-26px_rgba(16,44,87,0.3)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-compact font-semibold text-white">
                    {step.step}
                  </span>
                  <Icon className="h-5 w-5 text-action" aria-hidden />
                  <h3 className="text-compact font-semibold text-navy">{step.title}</h3>
                  <p className="text-compact text-slate">{step.description}</p>

                  {!isLast ? (
                    <ArrowRight
                      className="absolute top-1/2 -right-4 hidden h-5 w-5 -translate-y-1/2 text-border lg:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
