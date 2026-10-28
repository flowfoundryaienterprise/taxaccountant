import Link from "next/link";
import { CalendarCheck, Scale } from "lucide-react";

import { PortraitImage } from "@/components/shared/portrait-image";
import { formatContentDate } from "@/lib/cms/content-formatters";
import { resourceHref, type ResourceCardModel } from "@/lib/marketplace/public-content-types";

/**
 * One published resource in the index grid.
 *
 * Shows the last-reviewed date in preference to the publish date, because
 * for tax content "when was this last checked" is the more useful fact. Both
 * are available on the detail page; neither is ever substituted for the
 * other.
 *
 * The model it accepts has no status field, so this card has no way to
 * render an unpublished resource even if one reached it.
 */
export function ResourceCard({ resource }: { resource: ResourceCardModel }) {
  const reviewed = formatContentDate(resource.reviewedAt);
  const published = formatContentDate(resource.publishedAt);

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-card border border-border bg-white shadow-[0_20px_40px_-32px_rgba(16,44,87,0.3)] transition-all duration-200 hover:-translate-y-1">
      {resource.image ? (
        <PortraitImage
          src={resource.image.path}
          alt={resource.image.alt}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="relative aspect-[16/9] w-full overflow-hidden bg-tint"
        />
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-tint px-2.5 py-1 text-caption font-medium text-navy">
            {resource.category}
          </span>
          {resource.jurisdictionLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-caption font-medium text-slate">
              <Scale className="h-3 w-3" aria-hidden />
              {resource.jurisdictionLabel}
            </span>
          ) : null}
        </div>

        <h3 className="text-compact font-semibold text-navy">
          <Link href={resourceHref(resource.slug)} className="hover:text-action hover:underline">
            {resource.title}
          </Link>
        </h3>

        {resource.excerpt ? (
          <p className="text-compact text-slate">{resource.excerpt}</p>
        ) : null}

        {reviewed || published ? (
          <p className="mt-auto flex items-start gap-1.5 pt-1 text-caption text-slate">
            <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden />
            <span>
              {reviewed ? `Last reviewed ${reviewed}` : `Published ${published}`}
            </span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
