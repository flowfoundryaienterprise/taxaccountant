import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { whyChooseUs } from "@/lib/home-content";

export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow="Why choose TaxAccountant" title="A Smarter Way to Manage Your Taxes" />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {whyChooseUs.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delayMs={index * 70}>
                <div className="group flex flex-col gap-3 border-t-2 border-border pt-5 transition-colors duration-200 hover:border-action">
                  <span className="flex h-10 w-10 items-center justify-center rounded-input bg-tint text-action transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-compact font-semibold text-navy">{item.title}</h3>
                  <p className="text-compact text-slate">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
