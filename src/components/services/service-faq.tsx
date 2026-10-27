import { Container } from "@/components/layout/container";
import { FaqAccordion, type FaqItem } from "@/components/shared/faq-accordion";
import { SectionHeading } from "@/components/shared/section-heading";

interface ServiceFaqProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  items: FaqItem[];
  structuredData?: boolean;
  /** `plain` for a white section, `tinted` for the pale-blue band. */
  tone?: "plain" | "tinted";
  id?: string;
}

export function ServiceFaq({
  title = "Frequently asked questions",
  eyebrow = "FAQs",
  description,
  items,
  structuredData = false,
  tone = "plain",
  id = "faqs",
}: ServiceFaqProps) {
  if (items.length === 0) return null;

  return (
    <section id={id} className={tone === "tinted" ? "bg-tint/50 py-16 sm:py-20" : "py-16 sm:py-20"}>
      <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-12">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <FaqAccordion items={items} structuredData={structuredData} />
      </Container>
    </section>
  );
}
