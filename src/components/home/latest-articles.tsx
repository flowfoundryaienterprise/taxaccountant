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
          {/*
            Both links here pointed at `/find-accountant` — an article card
            and a "View All Articles" link that opened the professional
            directory. `/resources` is where guides live; it publishes
            nothing yet and says so, which is the honest destination for a
            link that promises articles.
          */}
          <SectionHeading eyebrow="Resources" title="Guides in preparation" />
          <Link
            href="/resources"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-medium text-action transition-colors duration-150 hover:text-navy"
          >
            All resources
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
