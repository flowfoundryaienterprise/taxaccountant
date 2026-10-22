import Image from "next/image";
import { ShieldCheck, Star, Users } from "lucide-react";

import { AccountantSearch } from "@/components/shared/accountant-search";
import { Container } from "@/components/layout/container";
import { heroImage, heroTrustList } from "@/lib/home-content";

export function HeroSection() {
  return (
    <section className="overflow-hidden border-b border-border bg-tint">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="animate-fade-up text-caption font-semibold uppercase tracking-wide text-action">
            Global tax &amp; accounting marketplace
          </p>
          <h1
            className="animate-fade-up text-hero font-semibold tracking-tight text-navy"
            style={{ animationDelay: "80ms" }}
          >
            Find Trusted Tax Accountants <span className="text-action">Anywhere</span> in the World
          </h1>
          <p
            className="animate-fade-up max-w-[52ch] text-lead text-slate"
            style={{ animationDelay: "150ms" }}
          >
            Compare qualified tax professionals, book consultations, and get expert help for tax
            preparation, accounting, bookkeeping, and business advisory.
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
            <AccountantSearch />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-panel bg-white sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="animate-float absolute top-6 -left-4 hidden items-center gap-3 rounded-card border border-border bg-white p-3 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.3)] sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint text-action">
                <Users className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-compact font-semibold text-navy">10,000+</p>
                <p className="text-caption text-slate">Verified Professionals</p>
              </div>
            </div>

            <div
              className="animate-float absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-card border border-border bg-white p-4 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.3)] sm:flex"
              style={{ animationDelay: "1.1s" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-input bg-tint text-action">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-compact font-semibold text-navy">100% Secure &amp; Safe</p>
                <p className="text-caption text-slate">Your data is always protected</p>
              </div>
            </div>

            <div
              className="animate-float absolute -top-4 -right-2 hidden items-center gap-3 rounded-card border border-border bg-white p-4 shadow-[0_20px_40px_-24px_rgba(16,44,87,0.3)] sm:flex"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-input bg-tint text-action">
                <Star className="h-5 w-5 fill-warning text-warning" aria-hidden />
              </span>
              <div>
                <p className="text-compact font-semibold text-navy">4.9/5</p>
                <p className="text-caption text-slate">Average Rating</p>
              </div>
            </div>
          </div>

          <div className="hidden rounded-panel border border-border bg-white p-5 sm:block">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {heroTrustList.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
                    <div>
                      <p className="text-compact font-medium text-navy">{item.title}</p>
                      <p className="text-caption text-slate">{item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
