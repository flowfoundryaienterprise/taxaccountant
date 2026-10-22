import Link from "next/link";

import { Container } from "@/components/layout/container";
import { LocaleSelectors } from "@/components/layout/locale-selectors";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavDropdown, type NavDropdownItem } from "@/components/layout/nav-dropdown";
import { ScrollHeader } from "@/components/layout/scroll-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { services } from "@/lib/home-content";

const serviceItems: NavDropdownItem[] = services.map((service) => ({
  label: service.title,
  href: `/find-accountant?service=${service.slug}`,
  available: true,
}));

const resourceItems: NavDropdownItem[] = [
  { label: "Tax Guides", href: "/#articles", available: true },
  { label: "Country Tax Facts", href: "/#coverage", available: true },
  { label: "Tax Calendar", href: "/resources", available: false },
  { label: "Glossary", href: "/resources", available: false },
];

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Find an Accountant", href: "/find-accountant" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "For Businesses", href: "/find-accountant?service=business-tax-services" },
];

/**
 * Sign In / Create an Account intentionally point to the same honest
 * Phase 1 explainer — public accounts are Phase 2 (DESIGN.md section 6:
 * "Sign In may be staff-only or labeled clearly" in Phase 1).
 */
export function SiteHeader() {
  return (
    <ScrollHeader>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-heading-sm font-semibold text-navy transition-transform duration-200 hover:-translate-y-0.5">
          TaxAccountant
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-4 xl:gap-5 lg:flex">
          <Link href="/" className="group relative whitespace-nowrap text-compact font-medium text-navy transition-colors duration-150 hover:text-action">
            Home
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-action transition-[width] duration-200 group-hover:w-full" />
          </Link>
          <Link href="/find-accountant" className="group relative whitespace-nowrap text-compact font-medium text-navy transition-colors duration-150 hover:text-action">
            Find an Accountant
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-action transition-[width] duration-200 group-hover:w-full" />
          </Link>
          <NavDropdown label="Services" items={serviceItems} />
          <Link href="/#how-it-works" className="group relative whitespace-nowrap text-compact font-medium text-navy transition-colors duration-150 hover:text-action">
            How It Works
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-action transition-[width] duration-200 group-hover:w-full" />
          </Link>
          <NavDropdown label="Resources" items={resourceItems} />
          <Link
            href="/find-accountant?service=business-tax-services"
            className="group relative whitespace-nowrap text-compact font-medium text-navy transition-colors duration-150 hover:text-action"
          >
            For Businesses
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-action transition-[width] duration-200 group-hover:w-full" />
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSelectors />
          <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Sign In
          </Link>
          <Link
            href="/sign-in?intent=signup"
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
            )}
          >
            Create an Account
          </Link>
        </div>

        <MobileNavigation
          primaryLinks={primaryLinks}
          sections={[
            { label: "Services", items: serviceItems },
            { label: "Resources", items: resourceItems },
          ]}
        />
      </Container>
    </ScrollHeader>
  );
}
