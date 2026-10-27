import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href: string;
  variant?: "primary" | "outline" | "ghost";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional extra detail — e.g. what would have to happen for content to appear. */
  children?: React.ReactNode;
  actions?: EmptyStateAction[];
  /** `compact` fits inside a section; `panel` stands alone as the page body. */
  tone?: "compact" | "panel";
  className?: string;
}

/**
 * Shared "nothing here yet" block.
 *
 * DESIGN.md section 9: an empty state must say what is missing and offer a
 * way forward — never fabricate inventory to avoid looking empty. Used for
 * countries with no configured services, countries with no approved
 * resources, and services with no matching professionals.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  actions = [],
  tone = "compact",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-panel border border-border bg-tint/60 text-center",
        tone === "panel" ? "px-6 py-14" : "px-6 py-10",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-action shadow-[0_12px_24px_-16px_rgba(16,44,87,0.4)]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <div className="flex max-w-[52ch] flex-col gap-2">
        <h3 className="text-heading-sm font-semibold text-navy">{title}</h3>
        <p className="text-compact text-slate">{description}</p>
        {children}
      </div>

      {actions.length ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(buttonVariants({ variant: action.variant ?? "primary", size: "md" }))}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
