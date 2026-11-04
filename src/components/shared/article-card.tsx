import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DemoArticle } from "@/lib/home-content";

export function ArticleCard({ article }: { article: DemoArticle }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-white transition-colors duration-150 hover:border-action">
      <div className="relative aspect-[12/5] w-full overflow-hidden bg-tint">
        <Image
          src={article.photo}
          alt={article.photoAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-caption font-bold uppercase tracking-wide text-action">{article.category}</p>
        <h3 className="text-compact font-semibold text-navy">{article.title}</h3>

        {/*
          Was `/find-accountant`: a "Read More" on an article card that
          opened the professional directory. Guides live under
          `/resources`, which currently renders an honest empty state.
        */}
        <Link
          href="/resources"
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-2 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
        >
          View resources
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
