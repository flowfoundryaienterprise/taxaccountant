import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
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
 * Phase 1 content management, plus Phase 3's Stripe subscriptions
 * (`/admin/subscriptions`, brief section 8: "Admin dashboard displays
 * subscription records"). Still deliberately absent: bookings, payouts,
 * lead credits, sponsored placements and financial reporting — those
 * remain later-phase modules.
 */

/** Groups the sidebar renders as labelled sections, in this order. */
export type AdminNavGroup = "Overview" | "Manage" | "Content" | "System";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short description used by the overview quick-links and tooltips. */
  description: string;
  /** Sidebar section this item renders under. */
  group: AdminNavGroup;
  /** Hidden from a `cms_editor`'s nav — the page itself still re-checks the role server-side. */
  adminOnly?: boolean;
  available?: boolean;
}

export const ADMIN_ROOT = "/admin";

export const adminNavigation: AdminNavItem[] = [
  {href:"/admin/users",label:"Users",icon:Users,description:"User management is not available yet.",group:"Manage",available:false},
  {href:"/admin/reports",label:"Reports",icon:FileText,description:"Reporting is not available yet.",group:"System",available:false},
  {href:"/admin/activity",label:"Activity log",icon:ShieldCheck,description:"Audit log viewer is not available yet.",group:"System",available:false},
  {href:"/admin/enquiries",label:"Enquiries",icon:Inbox,description:"Customer enquiries to professionals.",group:"Manage",adminOnly:true},
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "What is published, what is in draft, and what needs review.",
    group: "Overview",
  },
  {
    href: "/admin/applications",
    adminOnly: true,
    label: "Professionals",
    icon: Users,
    description: "Professional listing records and publication state.",
    group: "Manage",
  },
  {
    href: "/admin/services",
    label: "Services",
    icon: Folder,
    description: "The public service category taxonomy.",
    group: "Manage",
  },
  {
    href: "/admin/countries",
    label: "Countries & jurisdictions",
    icon: Globe2,
    description: "Country records, discovery status and activation flags.",
    group: "Manage",
  },
  {
    href: "/admin/jurisdictions",
    label: "Tax jurisdictions",
    icon: Scale,
    description: "Tax authorities, grouped by country.",
    group: "Manage",
  },
  {
    href: "/admin/messages",
    label: "Contact messages",
    icon: Inbox,
    description: "Contact and professional-interest submissions.",
    group: "Manage",
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    description: "Stripe monthly billing records for professional firms.",
    group: "Manage",
  },
  {
    href: "/admin/pages",
    label: "Homepage & pages",
    icon: FileText,
    description: "Standalone website pages, guides and glossary entries.",
    group: "Content",
  },
  {
    href: "/admin/articles",
    label: "Blog",
    icon: Newspaper,
    description: "Editorial content with author and reviewer attribution.",
    group: "Content",
  },
  {
    href: "/admin/media",
    label: "Media library",
    icon: ImageIcon,
    description: "Approved public website assets.",
    group: "Content",
  },
  {
    href: "/admin/seo",
    label: "SEO management",
    icon: Search,
    description: "Titles, descriptions and indexing eligibility per route.",
    group: "System",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Site identity, navigation and display configuration.",
    group: "System",
  },
  {
    href: "/admin/staff",
    label: "Team & permissions",
    icon: ShieldCheck,
    description: "CMS staff accounts, roles and access.",
    group: "System",
    adminOnly: true,
  },
];

export const ADMIN_NAV_GROUP_ORDER: AdminNavGroup[] = ["Overview", "Manage", "Content", "System"];

/**
 * Longest-prefix match, so `/admin/pages/new` highlights "Pages" while
 * `/admin` stays exact (every route would otherwise match it).
 */
export function activeNavHref(pathname: string): string {
  if(pathname === "/admin/dashboard") return ADMIN_ROOT;
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
  admin: "Admin",
  dashboard: "Dashboard",
  applications: "Professionals",
  enquiries: "Enquiries",
  new: "New",
  edit: "Edit",
  pages: "Pages",
  services: "Services",
  countries: "Countries",
  jurisdictions: "Tax jurisdictions",
  professionals: "Professionals",
  articles: "Articles and resources",
  messages: "Messages",
  subscriptions: "Subscriptions",
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
