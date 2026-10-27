import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, Scale, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
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
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} structuredData />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="max-w-[20ch] text-hero font-semibold text-navy">
                Tax &amp; Accounting Services for Every Need
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
                  "group transition-transform duration-150 hover:-translate-y-0.5",
                )}
              >
                Find an Accountant
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
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

            <ul className="grid gap-4 pt-2 sm:grid-cols-3">
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
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-panel border border-border bg-white shadow-[0_28px_60px_-40px_rgba(16,44,87,0.45)] lg:aspect-[5/4]">
            <Image
              src="/images/article-accountant-calculator.jpg"
              alt="An accountant working through figures with a calculator, laptop and notebook"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
