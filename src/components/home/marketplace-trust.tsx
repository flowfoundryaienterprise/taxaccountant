import { Container } from "@/components/layout/container";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions, languageOptions } from "@/lib/directory/taxonomy";
import { services } from "@/lib/home-content";

/**
 * What the directory indexes, counted from the catalogues themselves.
 *
 * This band used to carry five figures from the reference template —
 * "10,000+ Verified Professionals", "50+ Countries Covered", "100,000+
 * Happy Clients", "4.9/5 Average Rating", "24/7 Customer Support" — above
 * a tinted icon tile each. None was true, and the second one was not even
 * the right order of magnitude: eight countries are open for discovery,
 * not fifty.
 *
 * Every figure here is `array.length` on the vocabulary the filters
 * actually run against, so the band cannot drift from the product: open a
 * jurisdiction in Convex and this reads one higher the same day. Figures
 * are mono and tabular so the four sit on one baseline and one rhythm.
 *
 * No icons. A stat is a number and its label; a globe beside the word
 * "countries" is decoration standing in for a fifth fact that does not
 * exist.
 */
const scope = [
  { value: services.length, label: "Service categories" },
  { value: discoverableCountries.length, label: "Countries open" },
  { value: jurisdictionOptions.length, label: "Tax jurisdictions" },
  { value: languageOptions.length, label: "Languages recorded" },
];

export function MarketplaceTrust() {
  return (
    <section className="border-y border-border bg-white">
      <Container className="py-10">
        <h2 className="text-caption text-slate">What this directory indexes today</h2>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
          {scope.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dd className="font-mono text-heading-lg font-medium tabular-nums text-navy">
                {item.value}
              </dd>
              <dt className="text-caption text-slate">{item.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
