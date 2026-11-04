import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";

import { FeaturedProfessionals } from "@/components/home/featured-professionals";

import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { LatestArticles } from "@/components/home/latest-articles";
import { MarketplaceTrust } from "@/components/home/marketplace-trust";

import { ServicesSection } from "@/components/home/services-section";

export const metadata: Metadata = {
  title: "Find Tax & Accounting Professionals",
  robots: { index: process.env.NODE_ENV === "production", follow: true },
  description:
    "Discover tax and accounting professionals by service, location, language, and tax jurisdiction on TaxAccountant.com.",
  openGraph: {
    title: "TaxAccountant.com — Tax & Accounting Marketplace",
    description:
      "Search tax and accounting professionals by country, tax jurisdiction and service.",
    url: "/",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <div className="reference-home">
      {/*
        Organization and WebSite only. No SearchAction (it would advertise a
        search over fixture listings), no AggregateRating, no Person — see
        the note in `@/lib/seo/structured-data` for what is excluded and why.
      */}
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />

      {/*
        `TestimonialsSection` removed. Three quotes attributed to three
        named people, each with five filled stars, for a platform that has
        never had a client or a review. Unlike the stats band there is no
        honest version of that section to write, so it is gone rather than
        rewritten — restore it from git history once `reviews` exists in
        Convex and has rows. See the note in `@/lib/home-content`.
      */}
      <HeroSection />
      <MarketplaceTrust />
      <ServicesSection />
      <FeaturedProfessionals />
      <HowItWorks />
      <LatestArticles />


    </div>
  );
}
