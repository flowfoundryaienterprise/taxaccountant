/** Billing return URLs must stay on the configured application origin. */
export function approvedBillingUrl(value: string, siteUrl: string | undefined): string {
  if (!siteUrl) throw new Error("Billing return origin is not configured (SITE_URL).");
  const expected = new URL(siteUrl);
  const url = new URL(value);
  if (url.origin !== expected.origin || url.username || url.password || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("Billing return URL must use the application origin.");
  }
  return url.href;
}
