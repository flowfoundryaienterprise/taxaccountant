import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, absoluteUrl } from "@/lib/seo/site";

/**
 * JSON-LD builders.
 *
 * ## What may and may not go in here
 * Structured data is a set of machine-readable *claims*, and a false claim
 * in JSON-LD is worse than no claim: it is indexed, surfaced as a rich
 * result, and attributed to the brand. So every builder below emits only
 * facts this project genuinely holds.
 *
 * Deliberately **not** implemented, because the data does not exist:
 *
 *  - `AggregateRating` / `Review` — there is no review feature, no
 *    completed engagement and no rating anywhere in the schema.
 *  - `Person` / `ProfessionalService` for professionals — the profiles are
 *    development fixtures describing people who do not exist, and the
 *    credentials on them are explicitly unverified. Emitting
 *    `hasCredential` or a verified `ProfessionalService` would be a
 *    fabricated professional claim about a fabricated person.
 *  - `Offer` / `PriceSpecification` — no price, fee or quote exists.
 *  - `PostalAddress` — no business address has been approved for
 *    publication.
 *  - `FAQPage` — the FAQ blocks on the service and profile pages are
 *    genuine Q&A, but the Day 8 brief rules out "unsupported FAQ rich-result
 *    claims", and those answers are marketplace explanations rather than the
 *    authoritative answers an FAQ rich result implies.
 *
 * What remains is small and true: who runs the site, what the site is, and
 * where the reader is in its hierarchy.
 */

/** A JSON-LD node. `unknown` values keep callers from passing functions. */
export type JsonLdNode = Record<string, unknown>;

/**
 * The organization behind the site.
 *
 * No address, no telephone, no founding date, no logo claim beyond the
 * brand mark this project actually ships, and no `sameAs` — DATABASE.md
 * records that no social account has been registered or approved, and an
 * empty or invented `sameAs` is a claim about accounts that may not exist.
 */
export function organizationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
  };
}

/**
 * The website itself.
 *
 * `SearchAction` is deliberately omitted. It tells Google a sitelinks
 * search box may be offered, pointing at `/find-accountant?q=` — a route
 * that is currently `noindex` and backed by development fixtures.
 * Advertising a search over invented listings is the same category of
 * mistake as indexing them. Add it when the directory serves real data.
 */
export function webSiteJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    inLanguage: "en",
  };
}

export interface BreadcrumbEntry {
  name: string;
  /** Site-relative path. Omitted on the current page, which is not a link. */
  path?: string;
}

/** `BreadcrumbList` for a page's position in the hierarchy. */
export function breadcrumbJsonLd(entries: BreadcrumbEntry[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      ...(entry.path ? { item: absoluteUrl(entry.path) } : {}),
    })),
  };
}

/**
 * A published service category.
 *
 * `Service` without an `Offer`, a price or a provider rating — the site
 * describes what a category of work involves, and claims nothing about who
 * provides it or what it costs.
 */
export function serviceJsonLd(service: {
  name: string;
  description: string;
  slug: string;
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": `${SITE_ORIGIN}/#organization` },
    serviceType: service.name,
  };
}

/**
 * A published, reviewed resource article.
 *
 * `author` and `reviewedBy` are emitted only when the record genuinely
 * carries them. `dateModified` uses the review date where one exists,
 * because for tax content the review is the meaningful currency signal.
 *
 * Only ever called for content the public repository returns, which is
 * published and reviewed by construction — so this cannot describe a draft.
 */
export function articleJsonLd(article: {
  title: string;
  description?: string;
  slug: string;
  author?: string;
  reviewer?: string;
  publishedAt?: string;
  reviewedAt?: string;
  imagePath?: string;
}): JsonLdNode {
  const node: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    url: absoluteUrl(`/resources/${article.slug}`),
    mainEntityOfPage: absoluteUrl(`/resources/${article.slug}`),
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    inLanguage: "en",
  };

  if (article.description) node.description = article.description;
  if (article.imagePath) node.image = absoluteUrl(article.imagePath);
  if (article.publishedAt) node.datePublished = article.publishedAt;
  if (article.reviewedAt ?? article.publishedAt) {
    node.dateModified = article.reviewedAt ?? article.publishedAt;
  }
  if (article.author) node.author = { "@type": "Organization", name: article.author };
  if (article.reviewer) {
    node.reviewedBy = { "@type": "Person", name: article.reviewer };
  }

  return node;
}
