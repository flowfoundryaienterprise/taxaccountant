"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Heading2, List, MessageSquareQuote, Plus, Trash2, Type } from "lucide-react";

import type { ContentBlock } from "@/lib/admin/admin-types";
import { cn } from "@/lib/utils";

interface ContentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  disabled?: boolean;
}

/**
 * Structured block editor.
 *
 * ## Why not a rich-text editor
 * The Day 6 brief says not to add a large rich-text dependency without an
 * approved reason, and there is a stronger argument than bundle size: a
 * WYSIWYG field stores markup, and markup from a CMS field is the classic
 * injection surface. DESIGN.md calls for "safe headings, lists, links and
 * imagery from CMS content; no embedded executable HTML".
 *
 * So content is a typed array of four block kinds, each holding plain text.
 * It maps directly onto `contentPages.body` (DATABASE.md leaves the block
 * schema open), renders without `dangerouslySetInnerHTML`, and cannot carry
 * a script. Built with React state and no dependency at all.
 *
 * Reordering is by explicit move-up/move-down buttons rather than drag and
 * drop: buttons work with a keyboard and a screen reader for free, where a
 * drag surface needs a parallel keyboard implementation to be accessible.
 */

const BLOCK_META: Record<ContentBlock["type"], { label: string; icon: typeof Type }> = {
  heading: { label: "Heading", icon: Heading2 },
  paragraph: { label: "Paragraph", icon: Type },
  list: { label: "List", icon: List },
  callout: { label: "Callout", icon: MessageSquareQuote },
};

function newBlock(type: ContentBlock["type"]): ContentBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "list":
      return { type: "list", items: [""] };
    case "callout":
      return { type: "callout", text: "" };
    case "paragraph":
    default:
      return { type: "paragraph", text: "" };
  }
}

export function ContentEditor({ blocks, onChange, disabled }: ContentEditorProps) {
  const replace = (index: number, block: ContentBlock) => {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index));
  const append = (type: ContentBlock["type"]) => onChange([...blocks, newBlock(type)]);

  const controlClass =
    "w-full rounded-input border border-control bg-white px-3 py-2 text-compact text-navy placeholder:text-slate focus-visible:border-action disabled:cursor-not-allowed disabled:bg-subtle";

  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-input border border-control bg-white text-slate transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {blocks.map((block, index) => {
          const meta = BLOCK_META[block.type];
          const blockLabel = `${meta.label} block ${index + 1} of ${blocks.length}`;

          return (
            <section
              key={index}
              aria-label={blockLabel}
              className="flex flex-col gap-3 rounded-card border border-border bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-caption font-medium text-navy">
                  <meta.icon className="h-3.5 w-3.5 text-action" aria-hidden />
                  {meta.label}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={disabled || index === 0}
                    aria-label={`Move ${meta.label.toLowerCase()} block ${index + 1} up`}
                    className={iconButtonClass}
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={disabled || index === blocks.length - 1}
                    aria-label={`Move ${meta.label.toLowerCase()} block ${index + 1} down`}
                    className={iconButtonClass}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={disabled}
                    aria-label={`Remove ${meta.label.toLowerCase()} block ${index + 1}`}
                    className={cn(iconButtonClass, "hover:text-danger")}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>

              {block.type === "heading" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="sr-only" htmlFor={`block-${index}-level`}>
                    Heading level
                  </label>
                  <select
                    id={`block-${index}-level`}
                    value={block.level}
                    disabled={disabled}
                    onChange={(event) =>
                      replace(index, { ...block, level: Number(event.target.value) as 2 | 3 })
                    }
                    className={cn(controlClass, "sm:w-32")}
                  >
                    <option value={2}>Heading 2</option>
                    <option value={3}>Heading 3</option>
                  </select>

                  <label className="sr-only" htmlFor={`block-${index}-text`}>
                    Heading text
                  </label>
                  <input
                    id={`block-${index}-text`}
                    type="text"
                    value={block.text}
                    disabled={disabled}
                    onChange={(event) => replace(index, { ...block, text: event.target.value })}
                    placeholder="Section heading"
                    className={controlClass}
                  />
                </div>
              ) : null}

              {block.type === "paragraph" || block.type === "callout" ? (
                <>
                  <label className="sr-only" htmlFor={`block-${index}-text`}>
                    {meta.label} text
                  </label>
                  <textarea
                    id={`block-${index}-text`}
                    rows={block.type === "callout" ? 2 : 4}
                    value={block.text}
                    disabled={disabled}
                    onChange={(event) => replace(index, { ...block, text: event.target.value })}
                    placeholder={
                      block.type === "callout"
                        ? "Short note, disclaimer or caveat"
                        : "Body text. Plain text only — no HTML is stored or rendered."
                    }
                    className={cn(controlClass, "resize-y")}
                  />
                </>
              ) : null}

              {block.type === "list" ? (
                <div className="flex flex-col gap-2">
                  {block.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`block-${index}-item-${itemIndex}`}>
                        List item {itemIndex + 1}
                      </label>
                      <input
                        id={`block-${index}-item-${itemIndex}`}
                        type="text"
                        value={item}
                        disabled={disabled}
                        onChange={(event) => {
                          const items = [...block.items];
                          items[itemIndex] = event.target.value;
                          replace(index, { ...block, items });
                        }}
                        placeholder={`List item ${itemIndex + 1}`}
                        className={controlClass}
                      />
                      <button
                        type="button"
                        disabled={disabled || block.items.length === 1}
                        onClick={() =>
                          replace(index, {
                            ...block,
                            items: block.items.filter((_, i) => i !== itemIndex),
                          })
                        }
                        aria-label={`Remove list item ${itemIndex + 1}`}
                        className={iconButtonClass}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => replace(index, { ...block, items: [...block.items, ""] })}
                    className="inline-flex w-fit items-center gap-1.5 text-caption font-medium text-action disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Add list item
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-white px-4 py-6 text-center text-caption text-slate">
          No content blocks yet. Add one below to begin.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption font-medium text-slate">Add block:</span>
        {(Object.keys(BLOCK_META) as ContentBlock["type"][]).map((type) => {
          const meta = BLOCK_META[type];
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => append(type)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-input border border-control bg-white px-3 text-caption font-medium text-navy transition-colors duration-150 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40"
            >
              <meta.icon className="h-3.5 w-3.5 text-action" aria-hidden />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
