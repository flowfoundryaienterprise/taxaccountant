import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LocaleSelectors } from "@/components/layout/locale-selectors";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavDropdown, type NavDropdownItem } from "@/components/layout/nav-dropdown";
import { NavLink } from "@/components/layout/nav-link";
import { ScrollHeader } from "@/components/layout/scroll-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countryHref, serviceHref } from "@/lib/marketplace/query-params";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { serviceCatalog } from "@/lib/marketplace/services";

/**
 * Service menu items point at the **service detail pages**, not at a
 * pre-filtered directory search (Day 4 brief section 7/8). The overview link
 * is `featured`, so "All services" sits above the eight categories.
 */
const serviceItems: NavDropdownItem[] = [
  { label: "All services", href: "/services", available: true, featured: true },
  ...serviceCatalog.map((service) => ({
    label: service.title,
    href: serviceHref(service.slug),
    available: true,
  })),
];

/**
 * Only countries open for public discovery appear. If the catalogue is ever
 * empty the menu collapses to its overview link rather than listing
 * countries that have no page.
 */
const countryItems: NavDropdownItem[] = [
  { label: "All countries", href: "/countries", available: true, featured: true },
  ...discoverableCountries.map((country) => ({
    label: country.name,
    href: countryHref(country.code),
    available: true,
  })),
];

/**
 * `/resources` is not built yet (IMPLEMENTATION_PLAN.md day 16-17), so the
 * two entries that would live there stay disabled with a lock rather than
 * linking to a page that cannot answer. The rest point at destinations that
 * genuinely exist.
 *
 * "For Professionals" lives here rather than inline: seven top-level items
 * do not fit the header at any viewport width (see the note on the nav
 * below), and it is also in the mobile sheet and the footer.
 */
const resourceItems: NavDropdownItem[] = [
  { label: "For Professionals", href: "/for-professionals", available: true, featured: true },
  { label: "Tax Guides", href: "/#articles", available: true },
  { label: "Country Tax Facts", href: "/countries", available: true },
  { label: "Tax Calendar", href: "/resources", available: false },
  { label: "Glossary", href: "/resources", available: false },
];

/** The mobile sheet carries every destination, nothing abbreviated. */
const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Find an Accountant", href: "/find-accountant" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "For Professionals", href: "/for-professionals" },
];

/**
 * Sign In / Sign Up intentionally point to the same honest Phase 1
 * explainer — public accounts are Phase 2 (DESIGN.md section 6: "Sign In may
 * be staff-only or labeled clearly" in Phase 1).
 *
 * ## Why the desktop nav starts at `xl`, not `lg`
 * The container never exceeds 1216px of inner width (max-w-1280 minus
 * `px-8`). The brand (218px) and the account cluster (290px) take 508px of
 * that, leaving 676px for the nav. Six items measure 652px at `gap-4`; a
 * seventh does not fit at any width, and the whole row did not fit the
 * 960px available at `lg` — the header overflowed horizontally at 1024px
 * before this change, which the Day 4 responsive checks forbid. Below `xl`
 * the mobile sheet takes over, and it lists every destination.
 */
export function SiteHeader() {
  return (
    <ScrollHeader>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="TaxAccountant home"
          className="flex items-center gap-2.5 text-heading-sm font-semibold text-navy transition-transform duration-200 hover:-translate-y-0.5"
        >
          <BrandLogo size={32} className="shrink-0" />
          TaxAccountant
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-4 xl:flex">
          <NavLink label="Home" href="/" matchNested={false} />
          <NavLink label="Find an Accountant" href="/find-accountant" />
          <NavDropdown label="Services" items={serviceItems} activePrefix="/services" />
          <NavDropdown label="Countries" items={countryItems} activePrefix="/countries" />
          <NavLink label="How It Works" href="/#how-it-works" />
          <NavDropdown label="Resources" items={resourceItems} activePrefix="/resources" />
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
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
            Sign Up
          </Link>
        </div>

        <MobileNavigation
          primaryLinks={primaryLinks}
          sections={[
            { label: "Services", items: serviceItems },
            { label: "Countries", items: countryItems },
            { label: "Resources", items: resourceItems },
          ]}
        />
      </Container>
    </ScrollHeader>
  );
}
