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
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-white transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-28px_rgba(16,44,87,0.3)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-tint">
        <Image
          src={article.photo}
          alt={article.photoAlt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <time dateTime={article.date} className="text-caption text-slate">
          {formatDate(article.date)}
        </time>
        <h3 className="text-compact font-semibold text-navy">{article.title}</h3>

        <Link
          href="/find-accountant"
          className="group/link mt-auto inline-flex items-center gap-1.5 pt-2 text-compact font-semibold text-action"
        >
          Read More
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-1" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
