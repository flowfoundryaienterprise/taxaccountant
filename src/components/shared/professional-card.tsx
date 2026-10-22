import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";

import { PortraitImage } from "@/components/shared/portrait-image";
import type { DemoProfessional } from "@/lib/home-content";

export function ProfessionalCard({ professional }: { professional: DemoProfessional }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-[0_20px_40px_-28px_rgba(16,44,87,0.25)] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_28px_48px_-28px_rgba(16,44,87,0.35)]">
      <div className="relative">
        <PortraitImage
          src={professional.photo}
          alt={professional.photoAlt}
          className="relative aspect-[4/5] w-full overflow-hidden bg-tint"
        />
        <button
          type="button"
          aria-label={`Save ${professional.name}`}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate shadow-[0_8px_16px_-8px_rgba(16,44,87,0.4)] transition-colors duration-150 hover:text-danger"
        >
          <Heart className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-compact font-semibold text-navy">{professional.name}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
            <span className="text-caption font-semibold text-navy">{professional.rating}</span>
            <span className="text-caption text-slate">({professional.reviewCount} reviews)</span>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-compact text-slate">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {professional.city}, {professional.countryName}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {professional.services.map((service) => (
            <span
              key={service}
              className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy"
            >
              {service}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-compact font-semibold text-navy">{professional.rate}</span>
          <span className="flex items-center gap-1.5 text-caption font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            {professional.availability}
          </span>
        </div>

        <Link
          href="/find-accountant"
          className="mt-auto inline-flex h-10 items-center justify-center rounded-input bg-action text-compact font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#0668c7] active:translate-y-0 active:scale-[0.98]"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}
