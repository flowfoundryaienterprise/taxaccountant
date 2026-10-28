import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { absoluteUrl } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page is not a link. */
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  /**
   * Emit `BreadcrumbList` JSON-LD alongside the visible trail. Only set this
   * on pages that are actually indexable — structured data for a `noindex`
   * page is noise at best.
   */
  structuredData?: boolean;
  className?: string;
}

/**
 * Shared breadcrumb trail.
 *
 * Mirrors the markup the Day 3 `DirectoryHeader` already uses — ordered
 * list, `aria-label="Breadcrumb"`, `aria-current="page"` on the last item —
 * so every public page announces its position the same way.
 *
 * Long labels (country and service names) are the overflow risk on narrow
 * screens, so the list wraps and each label is allowed to break rather than
 * pushing the page sideways.
 */
export function Breadcrumbs({ items, structuredData = false, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-caption text-slate">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors duration-150 hover:text-action hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("min-w-0 break-words", isLast && "font-medium text-navy")}
                >
                  {item.label}
                </span>
              )}

              {isLast ? null : (
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {structuredData ? (
        <script
          type="application/ld+json"
          // Serialised from the same `items` the trail renders, so the
          // structured data cannot describe a different path than the page.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.label,
                ...(item.href ? { item: absoluteUrl(item.href) } : {}),
              })),
            }),
          }}
        />
      ) : null}
    </nav>
  );
}
