import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  /**
   * Emit `FAQPage` JSON-LD. Only pass this on indexable pages whose answers
   * have been reviewed — structured data on a `noindex` page is noise, and
   * marking up unreviewed answers would amplify them.
   */
  structuredData?: boolean;
  className?: string;
}

/**
 * Accessible FAQ accordion built on native `<details>` / `<summary>`.
 *
 * No JavaScript and no ARIA bookkeeping: the browser already gives this
 * keyboard operation (Enter/Space), an expanded/collapsed state exposed to
 * assistive technology, and in-page find that can open a closed section.
 * That matches AGENTS.md section 3 — reach for the platform before adding a
 * component with its own state machine.
 *
 * Items stay independently expandable; collapsing a sibling when another
 * opens would hide content a reader was comparing.
 */
export function FaqAccordion({ items, structuredData = false, className }: FaqAccordionProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-card border border-border bg-white transition-colors duration-150 open:border-action/40 hover:border-action/60"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-compact font-semibold text-navy [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="h-4 w-4 shrink-0 text-action transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="max-w-[80ch] px-5 pb-5 text-compact text-slate">{item.answer}</p>
        </details>
      ))}

      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }),
          }}
        />
      ) : null}
    </div>
  );
}
