import Image from "next/image";

import { AccountantSearch } from "@/components/shared/accountant-search";
import { Container } from "@/components/layout/container";
import { heroImage, heroTrustList } from "@/lib/home-content";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";

/**
 * Hero.
 *
 * ## What changed, and why
 * The previous hero put the headline on the left and, on the right, a
 * photograph with three cards floating over it — "10,000+ Verified
 * Professionals", "4.9/5 Average Rating", "100% Secure & Safe" — each
 * bobbing on an infinite `animate-float`, plus a fourth panel of five
 * trust claims below. Two problems, one of craft and one of fact.
 *
 * The craft problem is visible at 1440: the left column ended at the search
 * box while the right column ran on, leaving roughly 200px of dead tint
 * under the search and no optical balance between the halves. Three cards
 * pinned at three different offsets (`-left-4`, `-top-4`, `-bottom-5`) over
 * a photograph cannot be aligned to anything, which is why they were
 * nudged off-grid in the first place.
 *
 * The factual problem is that every number in them was invented. See the
 * note on `heroTrustList` in `@/lib/home-content`.
 *
 * Now: one photograph, filling its column, with nothing floating over it.
 * The four statements the site can actually support move under the search
 * as a quiet list, which is also what closes the dead band — the left
 * column now ends level with the image instead of halfway up it.
 */
export function HeroSection() {
  return (
    <section className="overflow-hidden border-b border-border bg-tint">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="animate-fade-up text-caption text-slate">
            Global tax and accounting marketplace
          </p>

          {/*
            The headline names the one thing that separates this directory
            from every other professional marketplace: an accountant is not
            useful because they are nearby, they are useful because they are
            authorised with the authority you file with. It replaces "Find
            Trusted Tax Accountants Anywhere in the World", which is Title
            Case, says "trusted" of profiles nobody has reviewed, and would
            fit any marketplace on earth with one noun swapped.
          */}
          <h1
            className="animate-fade-up text-hero font-semibold tracking-tight text-navy"
            style={{ animationDelay: "80ms" }}
          >
            Find a tax accountant authorised where you actually file
          </h1>

          <p
            className="animate-fade-up max-w-[52ch] text-lead text-slate"
            style={{ animationDelay: "150ms" }}
          >
            Search {jurisdictionOptions.length} tax jurisdictions across{" "}
            {discoverableCountries.length} countries by service and language. Residence and
            authorisation are separate filters, because they are separate facts.
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
            <AccountantSearch />
          </div>

          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-border pt-6 sm:grid-cols-2">
            {heroTrustList.map((item) => (
              <li key={item.title} className="flex flex-col gap-1">
                <p className="text-compact font-medium text-navy">{item.title}</p>
                <p className="text-caption text-slate">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-panel bg-white sm:aspect-[5/4] lg:aspect-auto">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
