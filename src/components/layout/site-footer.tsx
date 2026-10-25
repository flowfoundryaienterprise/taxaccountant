import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LocaleSelectors } from "@/components/layout/locale-selectors";
import {
  FacebookGlyph,
  InstagramGlyph,
  LinkedinGlyph,
  XGlyph,
  YoutubeGlyph,
} from "@/components/shared/social-icons";
import { services } from "@/lib/home-content";

type FooterLink = { label: string; href: string } | { label: string };

const quickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Find an Accountant", href: "/find-accountant" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Pricing" },
  { label: "Blog", href: "/#articles" },
  { label: "Contact" },
];

const servicesLinks: FooterLink[] = services
  .slice(0, 6)
  .map((service) => ({ label: service.title, href: `/find-accountant?service=${service.slug}` }));

const forProfessionalsLinks: FooterLink[] = [
  { label: "Join as a Professional", href: "/for-professionals" },
  { label: "Professional Login" },
  { label: "Pricing Plans" },
  { label: "Resources", href: "/#articles" },
  { label: "Help Center" },
];

const supportLinks: FooterLink[] = [
  { label: "FAQ" },
  { label: "Contact Us" },
  { label: "Live Chat" },
  { label: "Security & Privacy" },
  { label: "Terms of Service" },
];

const socialIcons = [
  { icon: FacebookGlyph, label: "Facebook" },
  { icon: LinkedinGlyph, label: "LinkedIn" },
  { icon: XGlyph, label: "X" },
  { icon: InstagramGlyph, label: "Instagram" },
  { icon: YoutubeGlyph, label: "YouTube" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-tint">
      <Container className="grid grid-cols-2 gap-10 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
          <Link
            href="/"
            aria-label="TaxAccountant home"
            className="flex items-center gap-2.5 text-heading-sm font-semibold text-navy"
          >
            <BrandLogo size={32} className="shrink-0" />
            TaxAccountant
          </Link>
          <p className="max-w-[32ch] text-compact text-slate">
            A global marketplace connecting individuals and businesses with trusted tax and
            accounting professionals.
          </p>
          <div className="flex items-center gap-2 pt-2">
            {socialIcons.map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-label={label}
                title={`${label} (not yet connected)`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-slate transition-colors duration-150 hover:border-action hover:text-action"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            ))}
          </div>
        </div>

        <FooterColumn title="Quick Links" links={quickLinks} />
        <FooterColumn title="Services" links={servicesLinks} />
        <FooterColumn title="For Professionals" links={forProfessionalsLinks} />
        <FooterColumn title="Support" links={supportLinks} />
      </Container>

      <Container className="flex flex-col gap-4 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-compact text-slate">&copy; {new Date().getFullYear()} TaxAccountant. All rights reserved.</p>
        <LocaleSelectors />
      </Container>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-caption font-semibold uppercase tracking-wide text-navy">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) =>
          "href" in link ? (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-compact text-slate transition-colors duration-150 hover:text-action"
              >
                {link.label}
              </Link>
            </li>
          ) : (
            <li key={link.label} className="text-compact text-slate/70">
              {link.label}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
