import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";

/**
 * `/sitemap.xml`
 *
 * ## Why a Route Handler and not `app/sitemap.ts`
 * Next.js's metadata-file convention is the idiomatic way to do this, and
 * it was tried first. It does not work here: vinext never registers
 * `app/sitemap.ts` or `app/robots.ts` as routes — neither appears in the
 * build manifest, and both paths returned the 404 page (measured Day 8).
 *
 * Route Handlers demonstrably work (`/api/health` has shipped since Day 1),
 * so the sitemap is served as one. The contents live in
 * `@/lib/seo/sitemap-entries` so the rule set can move to the convention
 * unchanged if vinext gains support.
 */

/** Minimal XML escaping for text that lands inside an element. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = await buildSitemapEntries();

  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        // W3C date format; the stored value is already ISO-8601.
        parts.push(`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`);
      }
      if (entry.changeFrequency) {
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Public, non-sensitive, and cheap to regenerate. No private data is
      // ever in here, so a shared cache is safe.
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
