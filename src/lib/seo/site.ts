/** The production host is supplied in .env.example and the deployment brief. */
const PRODUCTION_ORIGIN = "https://taxaccountant.flowfoundryai.in";

export function configuredOrigin(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const deploymentOrigin = configuredOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** One origin for canonicals, social metadata and sitemap URLs. */
export const SITE_ORIGIN = deploymentOrigin ?? PRODUCTION_ORIGIN;

/** Keep preview and unconfigured deployments out of search indexes. */
export function siteIsIndexable(origin: string | null, environment: string | undefined): boolean {
  return environment === "production" && origin === PRODUCTION_ORIGIN;
}

export const SITE_INDEXABLE = siteIsIndexable(
  deploymentOrigin,
  process.env.NEXT_PUBLIC_DEPLOYMENT_ENV,
);

export const SITE_ORIGIN_IS_DEFAULT = deploymentOrigin === null;
export const SITE_NAME = "TaxAccountant";
export const SITE_DESCRIPTION =
  "Find published tax and accounting professionals and explore available services.";

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_ORIGIN}/`;
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const [pathname, query] = withLeading.split("?");
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return `${SITE_ORIGIN}${trimmed}${query ? `?${query}` : ""}`;
}
