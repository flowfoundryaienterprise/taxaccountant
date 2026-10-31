import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { whyChooseUs } from "@/lib/home-content";

/**
 * Five positions, set as a two-column list separated by hairlines.
 *
 * Was a five-up grid of tinted icon tiles with `hover:border-action`,
 * `` and `` on the icon — the fourth
 * appearance of that same tile on one page. Five equal cards in a row also
 * forced every heading to be three words, which is how "We manually verify
 * credentials and experience" ended up claiming a review process that does
 * not exist (see `@/lib/home-content`).
 *
 * Given room, each line can say the specific thing instead of the category,
 * and the page gets a section that is not a card grid.
 */
export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading
          eyebrow="What this is"
          title="A directory built around jurisdiction"
          description="Most professional marketplaces index people by city. Tax does not work that way."
        />

        <ul className="flex flex-col">
          {whyChooseUs.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 60}>
              <li className="flex flex-col gap-1.5 border-b border-border py-5 first:pt-0 sm:flex-row sm:gap-8">
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
