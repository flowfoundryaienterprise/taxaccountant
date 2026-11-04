import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { heroImage } from "@/lib/home-content";

export function HeroSection() {
  return <section className="reference-hero">
    <div className="reference-hero-photo"><Image src={heroImage.src} alt={heroImage.alt} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" /></div>
    <Container className="relative"><div className="reference-hero-copy">
      <p className="text-caption font-bold tracking-[0.18em] uppercase">Expert tax &amp; accounting support</p>
      <h1>Expert advice.<br /><span className="text-action">For every chapter.</span></h1>
      <p className="max-w-[35ch] text-lead text-slate">Explore accountants and tax professionals for your personal, business and cross-border needs.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/find-accountant" className={buttonVariants({size: "md"})}>Explore professionals <ArrowUpRight size={16} aria-hidden /></Link>
        <Link href="/services" className={buttonVariants({variant: "outline", size: "md"})}>View services</Link>
      </div>
    </div></Container>
  </section>;
}
