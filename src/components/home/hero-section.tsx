import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { heroImage } from "@/lib/home-content";

export function HeroSection() {
  return (
    <section className="editorial-hero" aria-labelledby="home-title">
      <div className="editorial-hero-image">
        <Image src={heroImage.src} alt={heroImage.alt} fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
      </div>
      <Container className="editorial-hero-inner">
        <div className="editorial-hero-copy">
          <h1 id="home-title">Find the right accountant.</h1>
          <p className="editorial-hero-description">Discover tax and accounting professionals by service, location and jurisdiction. Explore experience, then make an enquiry when you are ready.</p>
          <Link href="/find-accountant" className="editorial-hero-action">Find a professional <ArrowUpRight size={19} aria-hidden /></Link>
        </div>
        <div className="editorial-hero-index" aria-label="Explore by need">
          <Link href="/services/individual-tax-preparation">Personal tax <ArrowUpRight size={16} aria-hidden /></Link>
          <Link href="/services/business-tax-services">Business tax <ArrowUpRight size={16} aria-hidden /></Link>
          <Link href="/services/international-tax-services">Cross-border <ArrowUpRight size={16} aria-hidden /></Link>
        </div>
      </Container>
    </section>
  );
}
