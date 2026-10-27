import { Info } from "lucide-react";

import type { CmsBlock } from "@/lib/cms/content-types";

/**
 * Renders structured content blocks.
 *
 * Shared by the CMS preview and the public resource pages, deliberately: a
 * preview that renders differently from the live page is not a preview. If
 * this component changes, both change together.
 *
 * No `dangerouslySetInnerHTML` anywhere. Blocks hold plain text and the
 * vocabulary is closed, so CMS content cannot carry markup or script onto a
 * public page — the reason the block editor exists instead of a rich-text
 * field (DESIGN.md: "no embedded executable HTML").
 */
export function ContentBlocks({ blocks }: { blocks: CmsBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={index} className="text-heading-sm font-semibold text-navy">
                {block.text}
              </h2>
            ) : (
              <h3 key={index} className="text-compact font-semibold text-navy">
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p key={index} className="max-w-[72ch] text-body text-slate">
                {block.text}
              </p>
            );

          case "list":
            return (
              <ul key={index} className="flex max-w-[72ch] list-disc flex-col gap-2 pl-5">
                {block.items
                  .filter((item) => item.trim())
                  .map((item, itemIndex) => (
                    <li key={itemIndex} className="text-body text-slate">
                      {item}
                    </li>
                  ))}
              </ul>
            );

          case "callout":
            return (
              <p
                key={index}
                className="flex max-w-[72ch] gap-2 rounded-card border border-border bg-tint/60 px-4 py-3 text-compact text-slate"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
                <span>{block.text}</span>
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
