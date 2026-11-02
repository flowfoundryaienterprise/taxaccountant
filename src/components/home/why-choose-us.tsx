import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { whyChooseUs } from "@/lib/home-content";

/**
 * Five positions, set as a two-column list separated by hairlines — kept
 * from the original pass, which already rejected the five-up tinted-icon
 * grid. Redesign note: wider asymmetric split (0.7fr/1.3fr instead of
 * 0.8fr/1.2fr) and a left accent rule that lights up on hover/focus,
 * replacing a static list with a small amount of tactile feedback per row.
 */
export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeading
          eyebrow="What this is"
          title="A directory built around jurisdiction"
          description="Most professional marketplaces index people by city. Tax does not work that way."
        />

        <ul className="flex flex-col">
          {whyChooseUs.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 60}>
              <li className="group flex flex-col gap-1.5 border-b border-l-2 border-border border-l-transparent py-5 pl-4 transition-colors duration-200 first:pt-0 hover:border-l-action focus-within:border-l-action sm:flex-row sm:gap-8">
                <h3 className="text-compact font-medium text-navy sm:w-56 sm:shrink-0">
                  {item.title}
                </h3>
                <p className="text-compact text-slate">{item.description}</p>
              </li>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
