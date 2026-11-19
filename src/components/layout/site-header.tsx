import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavLink } from "@/components/layout/nav-link";
import { ScrollHeader } from "@/components/layout/scroll-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const links = [
  {label: "Find a professional", href: "/find-accountant"},
  {label: "Services", href: "/services"},
  {label: "How it works", href: "/how-it-works"},
  {label: "Resources", href: "/resources"},
];
export function SiteHeader() {
  return (
    <ScrollHeader>
      <Container className="premium-header flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="TaxAccountant home"
          className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-[-0.04em] text-navy hover:text-action transition-colors duration-150"
        >
          <BrandLogo size={30} />TaxAccountant
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 xl:flex">
          {links.map((link) => (
            <NavLink key={link.href} {...link} matchNested={link.href !== "/"} />
          ))}
        </nav>
        <div className="hidden items-center gap-4 xl:flex">
          <Link
            href="/login"
            className="text-compact font-medium text-navy hover:text-action transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/for-professionals"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hover:scale-[1.02] transition-transform duration-150",
            )}
          >
            List your practice
            <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>
        <MobileNavigation primaryLinks={links} sections={[]} />
      </Container>
    </ScrollHeader>
  );
}
