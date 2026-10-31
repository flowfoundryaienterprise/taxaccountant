import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  FileText,
  Globe2,
  MessageSquareText,
  RotateCcw,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";

/**
 * Homepage content.
 *
 * Originally a direct content replica of the supplied reference template,
 * ratings, prices, stats and testimonials included. Those are gone: every
 * figure and quote in that set was invented, and this is the one indexable
 * page on the site. What remains either describes a capability that exists
 * in this repository, or is derived from the catalogues and fixtures so it
 * cannot drift from them.
 *
 * Nothing here is backed by Convex yet — see IMPLEMENTATION_PLAN.md Day
 * 5/9/10 for when real `convex/professionals` and `convex/taxonomy` queries
 * replace these fixtures.
 */

export interface ServiceItem {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const services: ServiceItem[] = [
  {
    slug: "individual-tax-preparation",
    title: "Individual Tax Preparation",
    description: "Annual filing support for residents, expatriates and dual-status filers",
    icon: FileText,
  },
  {
    slug: "business-tax-services",
    title: "Business Tax Services",
    description: "Corporate, partnership and entity-level filing across jurisdictions",
    icon: Building2,
  },
  {
    slug: "bookkeeping-accounting",
    title: "Bookkeeping & Accounting",
    description: "Ongoing ledgers, reconciliations and financial statement preparation",
    icon: Calculator,
  },
  {
    slug: "payroll-services",
    title: "Payroll Services",
    description: "Multi-jurisdiction payroll processing, withholding and filings",
    icon: Wallet,
  },
  {
    slug: "tax-planning-advisory",
    title: "Tax Planning & Advisory",
    description: "Forward-looking structuring and liability planning with a licensed advisor",
    icon: Scale,
  },
  {
    slug: "international-tax-services",
    title: "International Tax Services",
    description: "Cross-border income, treaty positions and foreign reporting obligations",
    icon: Globe2,
  },
  {
    // Slug kept as-is so existing `?service=` links and bookmarks still
    // resolve; the title dropped its "IRS /" prefix in Day 4 because the
    // category is offered across jurisdictions, not only in the US.
    slug: "irs-tax-audit-support",
    title: "Tax Audit Support",
    description: "Representation and documentation support through an active audit",
    icon: ShieldCheck,
  },
  {
    slug: "amended-tax-returns",
    title: "Amended Tax Returns",
    description: "Corrections and refiling for previously submitted returns",
    icon: RotateCcw,
  },
];

/*
 * `StatItem`/`statsBand` removed.
 *
 * The five figures it carried — "10,000+ Verified Professionals",
 * "50+ Countries Covered", "100,000+ Happy Clients", "4.9/5 Average
 * Rating", "24/7 Customer Support" — were replicated from the reference
 * template and not one of them was backed by anything in this codebase.
 * No profile has been verified (`verificationStatus` is `not_reviewed`
 * throughout), no rating or review data exists, and there is no support
 * desk. `MarketplaceTrust` now counts the catalogues instead, so every
 * number on that band is derived from data this repository actually holds
 * and cannot go stale.
 */

export interface HeroTrustItem {
  title: string;
  description: string;
}

/**
 * What the directory actually does, replacing five claims it could not
 * support: "Background & credential checks" (nothing is checked —
 * designations are self-declared and carry status "unverified"),
 * "Transparent Pricing / No hidden fees" (no price data exists anywhere in
 * this codebase), "Your data is protected", and "Support Anytime / We're
 * here to help" (there is no support channel).
 *
 * Each line below is a statement about a filter or a field that exists and
 * can be checked by opening `/find-accountant`. Icons dropped with the
 * claims: a shield next to an unverified claim is the claim again, drawn.
 */
export const heroTrustList: HeroTrustItem[] = [
  {
    title: "Filter by tax jurisdiction",
    description: "Separately from country — an accountant in Toronto may be authorised for US federal filings",
  },
  {
    title: "Credentials shown as declared",
    description: "With their review status, never as a verification this marketplace has not performed",
  },
  {
    title: "Remote or in person",
    description: "Recorded per professional, so distance is a filter and not a guess",
  },
  {
    title: "Eight languages",
    description: "Matched on the language the professional actually advises in",
  },
];

/**
 * The four profiles the homepage highlights, by fixture slug.
 *
 * Only the slugs live here. The projection to card props happens in
 * `FeaturedProfessionals` through `toCardModel`, because `card-model`
 * imports `directory/taxonomy`, and `directory/taxonomy` imports the
 * service and country vocabularies from *this* module — deriving the cards
 * here closes that loop and the module graph deadlocks at import time.
 *
 * The four used to be a hand-written copy carrying a rating, a review
 * count, an hourly rate and an availability line. None of those fields
 * exists on `DirectoryProfessional`, and none of the values was real:
 * `/find-accountant` says of these very same four records that "No
 * ratings, reviews, prices or availability are shown, because none of that
 * data exists yet", while the homepage, the one indexable page of the
 * three, stated them as fact under a real brand. Going through the
 * directory's own projection removes the fields by construction rather
 * than by discipline — there is no longer anywhere for a fabricated rating
 * to live.
 */
export const featuredSlugs = ["sarah-johnson", "michael-chen", "emily-rodriguez", "david-wilson"];

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

/**
 * The four steps now describe the Phase 1 flow that is actually built.
 *
 * They previously described a product that does not exist: step 2 offered
 * "reviews and pricing" (no review or price data exists in this codebase),
 * and step 3 was "Choose a time and book online or request a quote" —
 * booking is Phase 3 (PRD.md), and `publicContactMode` is `"none"` on every
 * profile today, so there is no time to choose and no quote to request.
 *
 * Icons dropped: a magnifying glass beside the word "Search" is the word
 * again. The step numbers carry the sequence on their own.
 */
export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Set the jurisdiction",
    description:
      "Start from the authority you file with — IRS, HMRC, CRA, ATO — rather than from a city",
  },
  {
    step: 2,
    title: "Narrow by service and language",
    description: "Eight service categories and eight languages, combined in a shareable URL",
  },
  {
    step: 3,
    title: "Compare the records",
    description:
      "Declared designations, authorised jurisdictions and consultation mode, side by side",
  },
  {
    step: 4,
    title: "Open a profile",
    description:
      "The full record, with its review status stated plainly. Direct contact opens in a later phase",
  },
];

export interface SearchCountry {
  code: string;
  name: string;
}

export const searchCountries: SearchCountry[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
];

export interface MapMarker {
  code: string;
  name: string;
  mapX: number;
  mapY: number;
}

/**
 * The eight countries open for public discovery, one marker each.
 *
 * Replaces seven markers labelled "2,500+ Experts", "3,000+ Experts" and so
 * on — invented head counts, two of which ("Europe", "Other Countries")
 * were not countries this site has a page for at all. The country names and
 * their authorised tax jurisdictions are now listed beside the map, where
 * they can be read, instead of floating over it in callouts.
 *
 * mapX/mapY are plain equirectangular projection math against the 800x400
 * world-map.svg (public domain, see public/images/ATTRIBUTIONS.md):
 * x% = (lon + 180) / 360 * 100, y% = (90 - lat) / 180 * 100.
 */
export const mapMarkers: MapMarker[] = [
  { code: "US", name: "United States", mapX: 22.6, mapY: 27.9 },
  { code: "CA", name: "Canada", mapX: 29.0, mapY: 24.8 },
  { code: "GB", name: "United Kingdom", mapX: 50.0, mapY: 21.4 },
  { code: "DE", name: "Germany", mapX: 53.7, mapY: 20.8 },
  { code: "AE", name: "United Arab Emirates", mapX: 65.1, mapY: 36.4 },
  { code: "IN", name: "India", mapX: 71.4, mapY: 34.1 },
  { code: "SG", name: "Singapore", mapX: 78.8, mapY: 49.3 },
  { code: "AU", name: "Australia", mapX: 91.4, mapY: 69.6 },
];

export interface WhyChooseItem {
  title: string;
  description: string;
}

/**
 * "We manually verify credentials and experience" was false — no profile
 * has been reviewed and `verificationStatus` is `not_reviewed` on every
 * row — so it now says what the platform actually does with a credential.
 * The rest are restated as the specific thing rather than the category:
 * "Transparent Pricing" became what the site can really promise about
 * price, which is that it does not hold any.
 *
 * Icons dropped. Five tinted icon tiles in a row said nothing that the
 * five headings did not already say, and they were the fourth appearance
 * of the same tile on one page.
 */
export const whyChooseUs: WhyChooseItem[] = [
  {
    title: "Jurisdiction, not just location",
    description:
      "Where someone is authorised to file is recorded separately from where they live, because the two are routinely different",
  },
  {
    title: "Credentials stated, not vouched for",
    description:
      "Designations appear as the professional declared them, with their review status next to them",
  },
  {
    title: "No ranking you cannot see",
    description:
      "Results are ordered by the filters you set. Nothing on this site is a paid placement",
  },
  {
    title: "Eight languages recorded",
    description:
      "Matched on the language a professional advises in, not the language of their country",
  },
  {
    title: "Built for cross-border cases",
    description:
      "Multiple authorisations per professional, so expatriate and dual-status work is a search and not a phone call",
  },
];

/*
 * `Testimonial`/`testimonials` removed, and `TestimonialsSection` with it.
 *
 * Three quotes, three names, three job titles and fifteen filled stars, for
 * a platform that has never had a client, a review or a rating. Unlike the
 * stats band there is no honest version of this section to write — a
 * testimonial is either something a real person said or it is nothing — so
 * it is gone rather than rewritten. `src/components/home/
 * testimonials-section.tsx` is deleted; restore it from git history when
 * `reviews` exists in Convex and has rows.
 */

export interface DemoArticle {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  icon: LucideIcon;
  photo: string;
  photoAlt: string;
}

export const heroImage = {
  src: "/images/hero-accountant.jpg",
  alt: "Tax professional reviewing figures on a laptop in a bright office",
};

export const professionalCtaImage = {
  src: "/images/cta-professionals.jpg",
  alt: "Two accounting professionals reviewing documents together",
};

export const demoArticles: DemoArticle[] = [
  {
    id: "article-1",
    category: "Tax Filing",
    title: "2025 Tax Filing Guide: Key Changes You Need to Know",
    excerpt: "The deadlines, brackets and form changes that matter most this filing season.",
    date: "2025-10-15",
    icon: FileText,
    photo: "/images/article-tax-documents.jpg",
    photoAlt: "Form 1040 tax return with a calculator and a sticky note reading 'Need help?'",
  },
  {
    id: "article-2",
    category: "Small Business",
    title: "Top Tax Deductions for Small Businesses in 2025",
    excerpt: "The deductions owners miss most often, and the records you need to claim them.",
    date: "2025-10-10",
    icon: Building2,
    photo: "/images/article-small-business.jpg",
    photoAlt: "Close-up of hands reviewing financial charts and cash at a desk",
  },
  {
    id: "article-3",
    category: "International Tax",
    title: "International Tax Guide for Remote Workers",
    excerpt: "What changes when your paycheck and your passport are issued by different countries.",
    date: "2025-10-05",
    icon: Globe2,
    photo: "/images/article-international-globe.jpg",
    photoAlt: "Hand placing a marker flag on a world globe over North America",
  },
  {
    id: "article-4",
    category: "Getting Started",
    title: "How to Choose the Right Tax Professional",
    excerpt: "The credentials, questions and red flags worth checking before you hire anyone.",
    date: "2025-10-03",
    icon: MessageSquareText,
    photo: "/images/article-accountant-calculator.jpg",
    photoAlt: "Hands using a calculator next to a laptop and notebook",
  },
];
