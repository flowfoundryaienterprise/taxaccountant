import type { Metadata } from "next";

import { FeaturedProfessionals } from "@/components/home/featured-professionals";
import { GlobalCoverage } from "@/components/home/global-coverage";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { LatestArticles } from "@/components/home/latest-articles";
import { MarketplaceTrust } from "@/components/home/marketplace-trust";
import { ProfessionalCTA } from "@/components/home/professional-cta";
import { ServicesSection } from "@/components/home/services-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { WhyChooseUs } from "@/components/home/why-choose-us";

export const metadata: Metadata = {
  title: "Find Trusted Tax Accountants Anywhere in the World",
  description:
    "Search tax and accounting professionals by country, tax jurisdiction and service. A Phase 1 public marketplace preview from TaxAccountant.com.",
  openGraph: {
    title: "TaxAccountant.com — Global Tax & Accounting Marketplace",
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
    <>
      <HeroSection />
      <ServicesSection />
      <MarketplaceTrust />
      <FeaturedProfessionals />
      <HowItWorks />
      <GlobalCoverage />
      <WhyChooseUs />
      <TestimonialsSection />
      <LatestArticles />
      <ProfessionalCTA />
    </>
  );
}
