import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { adminNavigation } from "@/lib/admin/admin-navigation";

/**
 * Unknown CMS record or route.
 *
 * Reached by an unknown page, article, service, country or professional id.
 * Says nothing about whether the record exists — the same answer for a typo
 * and for a record the reader may not see.
 */
export default function AdminNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tint text-action">
          <FileQuestion className="h-6 w-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-heading-lg font-semibold text-navy">We could not find that record</h1>
          <p className="max-w-[64ch] text-compact text-slate">
            The address may be mistyped, or the record may have been removed. The CMS sections
            below are the ones that exist.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adminNavigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full flex-col gap-1 rounded-card border border-border bg-white p-4 transition-colors duration-150 hover:bg-tint/40"
            >
              <span className="flex items-center gap-2 text-compact font-semibold text-navy">
                <item.icon className="h-4 w-4 text-action" aria-hidden />
                {item.label}
              </span>
              <span className="text-caption text-slate">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
