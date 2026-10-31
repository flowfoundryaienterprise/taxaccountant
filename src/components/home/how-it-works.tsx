import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { howItWorksSteps } from "@/lib/home-content";

/**
 * Four steps, set as a numbered sequence rather than four bordered cards.
 *
 * The page had six consecutive grids of equal-width cards — services,
 * professionals, these steps, why-choose, testimonials, articles — each
 * with a tinted icon tile and a ``. Six of the same
 * thing in a row is what makes a page read as a template no matter how
 * good the individual card is, so the two sections that are *not* really
 * card content (this one and `WhyChooseUs`) stop pretending to be.
 *
 * A step number in mono above a hairline carries the sequence better than
 * a navy circle did, and it drops the decorative arrows that used to sit
 * between the cards pointing at nothing on three of the four.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-tint py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, and what each one can actually do"
          description="Direct booking and messaging arrive in a later phase. These are the steps that work today."
        />

        <ol className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
            <Reveal key={step.step} delayMs={index * 70}>
              <li className="flex flex-col gap-2 border-t border-navy/15 pt-4">
                <span className="font-mono text-caption tabular-nums text-slate">
                  {String(step.step).padStart(2, "0")}
                </span>
                <h3 className="text-compact font-medium text-navy">{step.title}</h3>
                <p className="text-compact text-slate">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
