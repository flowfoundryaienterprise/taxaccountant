import Link from "next/link";
import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
const groups = [
  {title: "Explore", links: [{label: "Home", href: "/"}, {label: "Find an Accountant", href: "/find-accountant"}, {label: "Services", href: "/services"}, {label: "About us", href: "/about"}]},
  {title: "Professionals", links: [{label: "List your practice", href: "/for-professionals"}, {label: "Professional sign in", href: "/login"}, {label: "How it works", href: "/how-it-works"}]},
  {title: "Resources", links: [{label: "Blog", href: "/resources"}, {label: "Help center", href: "/help"}, {label: "Contact", href: "/contact"}]},
  {title: "Legal", links: [{label: "Privacy policy", href: "/privacy"}, {label: "Terms of service", href: "/terms"}]},
];
export function SiteFooter() {
  return (
    <footer className="premium-footer bg-navy text-white">
      <Container className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:py-20">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:pr-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight"><BrandLogo size={28} />TaxAccountant</Link>
          <p className="mt-4 max-w-[29ch] text-compact text-white/70">Find a tax or accounting professional for the work in front of you.</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-4 text-compact font-semibold">{group.title}</h2>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-compact text-white/70 hover:text-white hover:underline transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container>
        <p className="premium-footer-wordmark" aria-hidden>TaxAccountant</p>
      </Container>
      <Container className="flex flex-wrap justify-between gap-3 border-t border-white/20 py-5 text-caption text-white/70">
        <p>&copy; {new Date().getFullYear()} TaxAccountant. All rights reserved.</p>
        <p>English (US)</p>
      </Container>
    </footer>
  );
}
