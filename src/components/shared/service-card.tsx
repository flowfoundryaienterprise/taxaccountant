import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ServiceItem } from "@/lib/home-content";
import { serviceHref } from "@/lib/marketplace/query-params";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceItem;
  /**
   * Defaults to the service detail page. Day 4 brief section 8: a homepage
   * service card must open `/services/[slug]`, not jump straight into a
   * filtered directory search — the detail page explains the category first
   * and carries its own "find specialists" link.
   */
  href?: string;
  ctaLabel?: string;
  className?: string;
}

export function ServiceCard({ service, href, ctaLabel = "Learn more", className }: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <Link
      href={href ?? serviceHref(service.slug)}
      className={cn(
        /*
         * Hover is a border and a colour, not a 4px lift with a shadow
         * underneath. The card does not rise off the page when a pointer
         * passes over it, because it is not a physical object and nothing
         * about the hover means "closer".
         */
        "group flex h-full flex-col gap-4 rounded-card border border-border bg-white p-6 transition-colors duration-150 hover:border-action focus-visible:border-action",
        className,
      )}
    >
      {/*
        The tinted tile that filled with action blue on hover was the same
        tile used in the hero, the stats band, the steps and the
        why-choose grid — four appearances of one decoration on one page.
        The icon stays, at the muted text role, sized and stroked like
        every other icon on the site.
      */}
      <Icon className="h-[18px] w-[18px] text-slate" aria-hidden />
      <div className="flex flex-col gap-1.5">
        <h3 className="text-compact font-medium text-navy">{service.title}</h3>
        <p className="text-compact text-slate">{service.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-compact font-medium text-action">
        {ctaLabel}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
