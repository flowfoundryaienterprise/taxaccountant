import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavLink } from "@/components/layout/nav-link";
import { ScrollHeader } from "@/components/layout/scroll-header";
import { buttonVariants } from "@/components/ui/button";
const links = [
  {label: "Home", href: "/"}, {label: "Services", href: "/services"},
  {label: "Professionals", href: "/find-accountant"}, {label: "About Us", href: "/about"},
  {label: "How It Works", href: "/how-it-works"}, {label: "Blog", href: "/resources"},
];
export function SiteHeader() {
  return <ScrollHeader><Container className="flex h-16 items-center justify-between gap-4">
    <Link href="/" aria-label="TaxAccountant home" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"><BrandLogo size={30} />TaxAccountant</Link>
    <nav aria-label="Primary" className="hidden items-center gap-5 xl:flex">{links.map(link => <NavLink key={link.href} {...link} matchNested={link.href !== "/"} />)}</nav>
    <div className="hidden items-center gap-4 xl:flex">
      <Link href="/login" className="text-caption font-semibold">Sign In</Link>
      <Link href="/signup" className="text-caption font-semibold">Sign Up</Link>
      <Link href="/find-accountant" className={buttonVariants({size: "sm"})}>Find an Accountant <ArrowUpRight size={14} aria-hidden /></Link>
    </div>
    <MobileNavigation primaryLinks={links} sections={[]} />
  </Container></ScrollHeader>;
}
