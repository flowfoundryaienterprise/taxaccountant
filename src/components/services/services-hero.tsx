import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, Scale, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { serviceCatalog } from "@/lib/marketplace/services";
import { directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

const assurances = [
  {
    icon: Scale,
    title: "Scope stated plainly",
    description: "What each category of work normally covers — and what it does not.",
  },
  {
    icon: Globe2,
    title: "Jurisdiction kept separate",
    description: "Where a professional is based is never treated as where they are authorized.",
  },
  {
    icon: ShieldCheck,
    title: "No invented claims",
    description: "No prices, deadlines or guarantees are published on these pages.",
  },
];

export function ServicesHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-tint/50">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 right-[2%] select-none text-[12rem] font-semibold leading-none tracking-tighter text-navy/[0.04] sm:text-[16rem]"
      >
        {serviceCatalog.length}
      </span>

      <Container className="relative flex flex-col gap-8 py-12 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} structuredData />

        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <Reveal className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-[16ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
                {serviceCatalog.length} service categories, one honest directory
              </h1>
              <p className="max-w-[62ch] text-lead text-slate">
                Explore tax and accounting services and find professionals with expertise relevant
                to your situation and tax jurisdiction.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={directoryHref()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group transition-transform duration-150",
                )}
              >
                Find an Accountant
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/countries"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Browse by country
              </Link>
            </div>

            <ul className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              {assurances.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex flex-col gap-1.5">
                    <Icon className="h-4 w-4 text-action" aria-hidden />
                    <p className="text-compact font-semibold text-navy">{item.title}</p>
                    <p className="text-caption text-slate">{item.description}</p>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal
            delayMs={120}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-panel border border-border bg-white shadow-float lg:aspect-[4/5]"
          >
            <Image
              src="/images/article-accountant-calculator.jpg"
              alt="An accountant working through figures with a calculator, laptop and notebook"
              fill
              priority
              sizes="(min-width: 1024px) 36vw, 100vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
