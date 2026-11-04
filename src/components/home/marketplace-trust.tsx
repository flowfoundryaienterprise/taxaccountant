import { Calendar, Globe2, Layers, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";

/**
 * Light trust band directly under the hero, matching the approved
 * light-blue mockup: four short facts with an icon each, not a stat wall.
 *
 * The country/jurisdiction count is still derived from the catalogues
 * (`discoverableCountries.length`, `jurisdictionOptions.length`) so it
 * cannot drift from what the directory actually indexes — see the removed
 * `statsBand` note in `@/lib/home-content` for why invented figures are not
 * an option here. The remaining three describe a capability the filters
 * genuinely offer rather than a claim this marketplace cannot support.
 */
interface TrustFact {
  icon: LucideIcon;
  label: string;
}

const facts: TrustFact[] = [
  {
    icon: Globe2,
    label: `${discoverableCountries.length} countries · ${jurisdictionOptions.length} jurisdictions`,
  },
  { icon: Layers, label: "Personal & business services" },
  { icon: MessageSquareText, label: "Multiple languages" },
  { icon: Calendar, label: "Remote & in-person options" },
];

export function MarketplaceTrust() {
  return (
    <section className="border-y border-border bg-tint">
      <Container className="grid grid-cols-1 gap-y-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-center gap-3">
            <fact.icon className="h-5 w-5 shrink-0 text-action" aria-hidden />
            <p className="text-compact font-medium text-navy">{fact.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
