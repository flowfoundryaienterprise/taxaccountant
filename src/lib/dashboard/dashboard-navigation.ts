import {
  Bell,
  CreditCard,
  Heart,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import type { DashboardNavItem } from "@/components/dashboard/dashboard-sidebar";

/**
 * Customer/professional dashboard sidebar contents.
 *
 * Imported directly by `DashboardSidebar` (a Client Component), never
 * passed in as a prop from a server page — a Lucide icon is a function
 * component, and React Server Components cannot serialize a function
 * across the server→client boundary ("Functions cannot be passed directly
 * to Client Components"). `AdminSidebar` already avoids this the same way:
 * `adminNavigation` (`@/lib/admin/admin-navigation`) is a plain module
 * import, not a prop. This file is that same pattern for the two public
 * dashboards.
 */
export const customerNavItems: DashboardNavItem[] = [
  { label: "Overview", href: "/customer/dashboard", icon: LayoutDashboard },
  { label: "Find Professionals", href: "/find-accountant", icon: Search },
  { label: "My Enquiries", href: "/customer/enquiries", icon: Inbox, available: false },
  { label: "Saved Professionals", href: "/customer/saved", icon: Heart, available: false },
  { label: "Notifications", href: "/customer/notifications", icon: Bell, available: false },
  { label: "Account Settings", href: "/customer/settings", icon: Settings, available: false },
];

export const professionalNavItems: DashboardNavItem[] = [
  { label: "Overview", href: "/professional/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/professional/onboarding", icon: UserRound },
  { label: "Lead Inbox", href: "/professional/leads", icon: Inbox, available: false },
  { label: "Subscription", href: "/professional/subscription", icon: CreditCard },
  { label: "Notifications", href: "/professional/notifications", icon: Bell, available: false },
  { label: "Account Settings", href: "/professional/settings", icon: Settings, available: false },
];
