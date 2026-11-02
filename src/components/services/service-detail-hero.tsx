import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { buttonVariants } from "@/components/ui/button";
import { audienceLabel, type ServiceCatalogEntry } from "@/lib/marketplace/services";
import { directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

export function ServiceDetailHero({ service }: { service: ServiceCatalogEntry }) {
  const Icon = service.icon;
  const findHref = directoryHref({ service: service.slug });

  return (
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-12 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: service.title },
          ]}
          structuredData
        />

        {/* Visual order flipped on `lg` (image left) while reading/DOM order
            keeps the heading first — asymmetric variety against the
            services index hero without disturbing heading-first a11y. */}
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal className="flex flex-col gap-6 lg:order-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-panel bg-navy text-white shadow-raised">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="rounded-full border border-border bg-white px-3 py-1 text-caption font-semibold text-navy">
                {audienceLabel(service.audience)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="max-w-[18ch] text-5xl font-semibold leading-[0.98] tracking-tight text-navy sm:text-6xl">
                {service.title}
              </h1>
              <p className="max-w-[62ch] text-lead text-slate">{service.overview}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={findHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group transition-transform duration-150",
                )}
              >
                Find specialists
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/services"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                All services
              </Link>
            </div>
          </Reveal>

          <Reveal
            delayMs={120}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-panel border border-border bg-white shadow-float lg:order-1 lg:aspect-[4/5]"
          >
            <Image
              src={service.image.src}
              alt={service.image.alt}
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
