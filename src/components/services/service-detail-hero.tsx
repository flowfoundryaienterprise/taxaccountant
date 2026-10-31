import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { audienceLabel, type ServiceCatalogEntry } from "@/lib/marketplace/services";
import { directoryHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

export function ServiceDetailHero({ service }: { service: ServiceCatalogEntry }) {
  const Icon = service.icon;
  const findHref = directoryHref({ service: service.slug });

  return (
    <section className="border-b border-border bg-tint/50">
      <Container className="flex flex-col gap-8 py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: service.title },
          ]}
          structuredData
        />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-input bg-white text-action shadow-[0_12px_24px_-18px_rgba(16,44,87,0.5)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="rounded-full border border-border bg-white px-3 py-1 text-caption font-semibold text-navy">
                {audienceLabel(service.audience)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="max-w-[20ch] text-hero font-semibold text-navy">{service.title}</h1>
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
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-panel border border-border bg-white shadow-[0_28px_60px_-40px_rgba(16,44,87,0.45)] lg:aspect-[5/4]">
            <Image
              src={service.image.src}
              alt={service.image.alt}
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
