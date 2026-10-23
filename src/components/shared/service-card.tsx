import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ServiceItem } from "@/lib/home-content";

export function ServiceCard({ service }: { service: ServiceItem }) {
  const Icon = service.icon;

  return (
    <Link
      href={`/find-accountant?service=${service.slug}`}
      className="group flex flex-col gap-4 rounded-card border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-action hover:shadow-[0_20px_36px_-26px_rgba(16,44,87,0.3)] focus-visible:border-action"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-input bg-tint text-action transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-action group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-compact font-semibold text-navy">{service.title}</h3>
        <p className="text-compact text-slate">{service.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-compact font-medium text-action">
        Find a specialist
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
