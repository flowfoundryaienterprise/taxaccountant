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
  return <footer className="bg-navy text-white">
    <Container className="grid grid-cols-2 gap-7 py-9 sm:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
      <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:border-r lg:border-white/20 lg:pr-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight"><BrandLogo size={28} />TaxAccountant</Link>
        <p className="mt-3 max-w-[32ch] text-compact text-white/80">Connecting people and businesses with tax and accounting expertise.</p>
      </div>
      {groups.map(group => <div key={group.title}><h2 className="mb-3 text-compact font-semibold">{group.title}</h2><ul className="space-y-2">{group.links.map(link => <li key={link.href}><Link href={link.href} className="text-caption text-white/80 hover:text-white hover:underline">{link.label}</Link></li>)}</ul></div>)}
    </Container>
    <Container className="flex flex-wrap justify-between gap-3 border-t border-white/20 py-4 text-caption text-white/80"><p>&copy; {new Date().getFullYear()} TaxAccountant. All rights reserved.</p><p>English (US)</p></Container>
  </footer>;
}
