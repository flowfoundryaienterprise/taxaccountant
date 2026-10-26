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
        "group flex h-full flex-col gap-4 rounded-card border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-action hover:shadow-[0_20px_36px_-26px_rgba(16,44,87,0.3)] focus-visible:border-action",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-input bg-tint text-action transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-action group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-compact font-semibold text-navy">{service.title}</h3>
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
