import type { JsonLdNode } from "@/lib/seo/structured-data";

/**
 * Injects a JSON-LD block.
 *
 * ## Escaping
 * JSON-LD has to go inside a `<script>` element, which means the serialized
 * payload is parsed as HTML before it is parsed as JSON. A `</script>`
 * sequence anywhere in the data — in an article title, a professional's
 * name, anything author-controlled — would close the element early and
 * everything after it would be parsed as markup.
 *
 * `JSON.stringify` does not escape it, because `/` is a legal JSON
 * character. So `<` is escaped to its unicode form, which JSON parsers read
 * back as the same string while the HTML parser never sees a tag. `&` and
 * `>` go too: they are harmless on their own but cheap to neutralise, and
 * being thorough here costs nothing.
 *
 * This matters more as CMS content becomes real — today's structured data
 * is built from code constants, but the article builder already takes
 * editor-supplied titles.
 */
function serialize(data: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\u003c")
    .replace(/>/g, "\u003e")
    .replace(/&/g, "\u0026");
}

interface JsonLdProps {
  /** One node, or several to emit as a single graph. */
  data: JsonLdNode | JsonLdNode[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
