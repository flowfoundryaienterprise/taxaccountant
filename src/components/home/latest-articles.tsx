import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { ArticleCard } from "@/components/shared/article-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { demoArticles } from "@/lib/home-content";

export function LatestArticles() {
  return (
    <section id="articles" className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/*
            Both links here pointed at `/find-accountant` — an article card
            and a "View All Articles" link that opened the professional
            directory. `/resources` is where guides live; it publishes
            nothing yet and says so, which is the honest destination for a
            link that promises articles.
          */}
          <SectionHeading eyebrow="Insights & resources" title="Fresh perspectives. Clearer decisions." />
          <Link
            href="/resources"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
          >
            All resources
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoArticles.slice(0, 3).map((article) => (
            <div key={article.id}>
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
        <p className="text-caption text-slate">Article concepts for design preview. Guides are not yet published.</p>
      </Container>
    </section>
  );
}
