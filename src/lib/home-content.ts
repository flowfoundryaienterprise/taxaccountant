import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calculator,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Globe2,
  GraduationCap,
  Headphones,
  Lock,
  MessageSquareText,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Homepage fixtures built as a direct content replica of the supplied
 * reference template (ratings, prices, stats, testimonials included per
 * explicit instruction). Nothing here is backed by Convex — see
 * IMPLEMENTATION_PLAN.md Day 5/9/10 for when real `convex/professionals`
 * and `convex/taxonomy` queries replace these fixtures.
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
    description: "Annual filing support for residents, expatriates and dual-status filers.",
    icon: FileText,
  },
  {
    slug: "business-tax-services",
    title: "Business Tax Services",
    description: "Corporate, partnership and entity-level filing across jurisdictions.",
    icon: Building2,
  },
  {
    slug: "bookkeeping-accounting",
    title: "Bookkeeping & Accounting",
    description: "Ongoing ledgers, reconciliations and financial statement preparation.",
    icon: Calculator,
  },
  {
    slug: "payroll-services",
    title: "Payroll Services",
    description: "Multi-jurisdiction payroll processing, withholding and filings.",
    icon: Wallet,
  },
  {
    slug: "tax-planning-advisory",
    title: "Tax Planning & Advisory",
    description: "Forward-looking structuring and liability planning with a licensed advisor.",
    icon: Scale,
  },
  {
    slug: "international-tax-services",
    title: "International Tax Services",
    description: "Cross-border income, treaty positions and foreign reporting obligations.",
    icon: Globe2,
  },
  {
    // Slug kept as-is so existing `?service=` links and bookmarks still
    // resolve; the title dropped its "IRS /" prefix in Day 4 because the
    // category is offered across jurisdictions, not only in the US.
    slug: "irs-tax-audit-support",
    title: "Tax Audit Support",
    description: "Representation and documentation support through an active audit.",
    icon: ShieldCheck,
  },
  {
    slug: "amended-tax-returns",
    title: "Amended Tax Returns",
    description: "Corrections and refiling for previously submitted returns.",
    icon: RotateCcw,
  },
];

export interface StatItem {
  icon: LucideIcon;
  value: string;
  label: string;
}

export const statsBand: StatItem[] = [
  { icon: ShieldCheck, value: "10,000+", label: "Verified Professionals" },
  { icon: Globe2, value: "50+", label: "Countries Covered" },
  { icon: Users, value: "100,000+", label: "Happy Clients" },
  { icon: Star, value: "4.9/5", label: "Average Rating" },
  { icon: Clock3, value: "24/7", label: "Customer Support" },
];

export interface HeroTrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const heroTrustList: HeroTrustItem[] = [
  { icon: ShieldCheck, title: "Verified Professionals", description: "Background & credential checks" },
  { icon: Eye, title: "Transparent Pricing", description: "No hidden fees" },
  { icon: FileCheck2, title: "Secure Document Sharing", description: "Your data is protected" },
  { icon: CalendarClock, title: "Online Consultations", description: "Video, chat or in-person" },
  { icon: Headphones, title: "Support Anytime", description: "We're here to help" },
];

export interface DemoProfessional {
  id: string;
  name: string;
  designation: string;
  city: string;
  countryName: string;
  services: string[];
  rating: number;
  reviewCount: number;
  rate: string;
  availability: string;
  photo: string;
  photoAlt: string;
}

export const demoProfessionals: DemoProfessional[] = [
  {
    id: "demo-1",
    name: "Sarah Johnson, CPA",
    designation: "Certified Public Accountant",
    city: "New York",
    countryName: "USA",
    services: ["Individual Tax", "Business Tax", "Tax Planning"],
    rating: 4.9,
    reviewCount: 124,
    rate: "$99/hr",
    availability: "Available Today",
    photo: "/images/professional-1.jpg",
    photoAlt: "Portrait of Sarah Johnson, a demo professional profile",
  },
  {
    id: "demo-2",
    name: "Michael Chen, EA",
    designation: "Enrolled Agent",
    city: "Toronto",
    countryName: "Canada",
    services: ["Business Tax", "Bookkeeping", "Payroll Services"],
    rating: 4.8,
    reviewCount: 96,
    rate: "$85/hr",
    availability: "Available Today",
    photo: "/images/professional-2.jpg",
    photoAlt: "Portrait of Michael Chen, a demo professional profile",
  },
  {
    id: "demo-3",
    name: "Emily Rodriguez, CPA",
    designation: "Certified Public Accountant",
    city: "London",
    countryName: "UK",
    services: ["Individual Tax", "International Tax", "Tax Advisory"],
    rating: 4.9,
    reviewCount: 118,
    rate: "$120/hr",
    availability: "Available Tomorrow",
    photo: "/images/professional-3.jpg",
    photoAlt: "Portrait of Emily Rodriguez, a demo professional profile",
  },
  {
    id: "demo-4",
    name: "David Wilson, CPA",
    designation: "Certified Public Accountant",
    city: "Sydney",
    countryName: "Australia",
    services: ["Business Tax", "Bookkeeping", "Tax Planning"],
    rating: 4.8,
    reviewCount: 102,
    rate: "$95/hr",
    availability: "Available Today",
    photo: "/images/professional-4.jpg",
    photoAlt: "Portrait of David Wilson, a demo professional profile",
  },
];

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Search & Compare",
    description: "Find professionals based on your needs, location and budget.",
    icon: Search,
  },
  {
    step: 2,
    title: "View Profiles",
    description: "Check qualifications, reviews, services and pricing.",
    icon: Users,
  },
  {
    step: 3,
    title: "Book a Consultation",
    description: "Choose a time and book online or request a quote.",
    icon: CalendarCheck,
  },
  {
    step: 4,
    title: "Get Expert Help",
    description: "Meet with your accountant and get the support you need.",
    icon: CheckCircle2,
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
  expertsLabel: string;
  mapX: number;
  mapY: number;
}

/**
 * mapX/mapY are plain equirectangular projection math against the 800x400
 * world-map.svg (public domain, see public/images/ATTRIBUTIONS.md):
 * x% = (lon + 180) / 360 * 100, y% = (90 - lat) / 180 * 100.
 */
export const mapMarkers: MapMarker[] = [
  { code: "US", name: "USA", expertsLabel: "2,500+ Experts", mapX: 22.6, mapY: 27.9 },
  { code: "CA", name: "Canada", expertsLabel: "800+ Experts", mapX: 29.0, mapY: 24.8 },
  { code: "GB", name: "UK", expertsLabel: "1,300+ Experts", mapX: 50.0, mapY: 21.4 },
  { code: "EU", name: "Europe", expertsLabel: "3,000+ Experts", mapX: 56.0, mapY: 24.0 },
  { code: "IN", name: "India", expertsLabel: "3,000+ Experts", mapX: 71.4, mapY: 34.1 },
  { code: "AU", name: "Australia", expertsLabel: "700+ Experts", mapX: 91.4, mapY: 69.6 },
  { code: "XX", name: "Other Countries", expertsLabel: "2,000+ Experts", mapX: 46.0, mapY: 62.0 },
];

export interface WhyChooseItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const whyChooseUs: WhyChooseItem[] = [
  {
    title: "Verified & Qualified Professionals",
    description: "We manually verify credentials and experience.",
    icon: GraduationCap,
  },
  {
    title: "Transparent Pricing",
    description: "Compare rates and choose what fits your budget.",
    icon: Eye,
  },
  {
    title: "Secure & Confidential",
    description: "Your documents and data are encrypted and always protected.",
    icon: Lock,
  },
  {
    title: "Multiple Consultation Options",
    description: "Video, chat or in-person meetings.",
    icon: CalendarClock,
  },
  {
    title: "Dedicated Support",
    description: "Our team is here to help you anytime, anywhere.",
    icon: Headphones,
  },
];

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  photo: string;
  photoAlt: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "Found an excellent CPA through TaxAccountant. The process was easy and the service was outstanding.",
    name: "Jennifer M.",
    role: "Small Business Owner",
    photo: "/images/testimonial-1.jpg",
    photoAlt: "Portrait of Jennifer M., a demo testimonial avatar",
  },
  {
    id: "testimonial-2",
    quote: "Great platform with verified professionals. I saved time and got the right tax advice for my business.",
    name: "Robert K.",
    role: "E-commerce Business Owner",
    photo: "/images/testimonial-2.jpg",
    photoAlt: "Portrait of Robert K., a demo testimonial avatar",
  },
  {
    id: "testimonial-3",
    quote: "Very professional and secure. Highly recommend for anyone looking for tax help internationally.",
    name: "Maria S.",
    role: "Freelancer",
    photo: "/images/testimonial-3.jpg",
    photoAlt: "Portrait of Maria S., a demo testimonial avatar",
  },
];

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
