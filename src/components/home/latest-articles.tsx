import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ArticleCard } from "@/components/shared/article-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { demoArticles } from "@/lib/home-content";

export function LatestArticles() {
  return (
    <section id="articles" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Tax resources & guides" title="Latest Articles & Tax Tips" />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-semibold text-action"
          >
            View All Articles
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {demoArticles.map((article, index) => (
            <Reveal key={article.id} delayMs={index * 70}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
