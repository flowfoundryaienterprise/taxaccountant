import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Folder,
  Globe2,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * CMS sidebar navigation.
 *
 * Phase 1 content management only. Deliberately absent: bookings, payments,
 * payouts, subscriptions, lead credits, sponsored placements and financial
 * reporting — those are Phase 3/4 modules and the Day 6 brief forbids
 * surfacing them here (section 4).
 */

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short description used by the overview quick-links and tooltips. */
  description: string;
  /** Hidden from a `cms_editor`'s nav — the page itself still re-checks the role server-side. */
  adminOnly?: boolean;
}

export const ADMIN_ROOT = "/admin";

export const adminNavigation: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    description: "What is published, what is in draft, and what needs review.",
  },
  {
    href: "/admin/pages",
    label: "Pages",
    icon: FileText,
    description: "Standalone website pages, guides and glossary entries.",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: Folder,
    description: "The public service category taxonomy.",
  },
  {
    href: "/admin/countries",
    label: "Countries",
    icon: Globe2,
    description: "Country records, discovery status and activation flags.",
  },
  {
    href: "/admin/jurisdictions",
    label: "Tax jurisdictions",
    icon: Scale,
    description: "Tax authorities, grouped by country.",
  },
  {
    href: "/admin/professionals",
    label: "Professionals",
    icon: Users,
    description: "Professional listing records and publication state.",
  },
  {
    href: "/admin/articles",
    label: "Articles and resources",
    icon: Newspaper,
    description: "Editorial content with author and reviewer attribution.",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: Inbox,
    description: "Contact and professional-interest submissions.",
  },
  {
    href: "/admin/media",
    label: "Media library",
    icon: ImageIcon,
    description: "Approved public website assets.",
  },
  {
    href: "/admin/seo",
    label: "SEO management",
    icon: Search,
    description: "Titles, descriptions and indexing eligibility per route.",
  },
  {
    href: "/admin/settings",
    label: "Site settings",
    icon: Settings,
    description: "Site identity, navigation and display configuration.",
  },
  {
    href: "/admin/staff",
    label: "Staff",
    icon: ShieldCheck,
    description: "CMS staff accounts, roles and access.",
    adminOnly: true,
  },
];

/**
 * Longest-prefix match, so `/admin/pages/new` highlights "Pages" while
 * `/admin` stays exact (every route would otherwise match it).
 */
export function activeNavHref(pathname: string): string {
  const matches = adminNavigation
    .map((item) => item.href)
    .filter((href) => (href === ADMIN_ROOT ? pathname === ADMIN_ROOT : pathname.startsWith(href)));

  return matches.sort((a, b) => b.length - a.length)[0] ?? "";
}

export interface AdminCrumb {
  label: string;
  href?: string;
}

/** Human labels for path segments that are not a known nav entry. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: "CMS",
  new: "New",
  edit: "Edit",
  pages: "Pages",
  services: "Services",
  countries: "Countries",
  jurisdictions: "Tax jurisdictions",
  professionals: "Professionals",
  articles: "Articles and resources",
  messages: "Messages",
  media: "Media library",
  seo: "SEO management",
  settings: "Site settings",
  staff: "Staff",
};

/**
 * Builds the admin breadcrumb trail from the pathname, with an optional
 * override for the final crumb (a record title rather than its id).
 */
export function adminBreadcrumbs(pathname: string, lastLabel?: string): AdminCrumb[] {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    const label =
      isLast && lastLabel ? lastLabel : (SEGMENT_LABELS[segment] ?? decodeURIComponent(segment));

    return isLast ? { label } : { label, href };
  });
}
