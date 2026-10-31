import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DemoArticle } from "@/lib/home-content";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ArticleCard({ article }: { article: DemoArticle }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-white transition-colors duration-150 hover:border-action">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-tint">
        <Image
          src={article.photo}
          alt={article.photoAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <time dateTime={article.date} className="font-mono text-caption tabular-nums text-slate">
          {formatDate(article.date)}
        </time>
        <h3 className="text-compact font-medium text-navy">{article.title}</h3>

        {/*
          Was `/find-accountant`: a "Read More" on an article card that
          opened the professional directory. Guides live under
          `/resources`, which currently renders an honest empty state.
        */}
        <Link
          href="/resources"
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-2 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
        >
          Read guide
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
