import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Scale, UserCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/layout/container";
import { ContentBlocks } from "@/components/shared/content-blocks";
import { MarketplaceCta } from "@/components/shared/marketplace-cta";
import {
  TAX_CONTENT_DISCLAIMER,
  contentDateline,
  jurisdictionNotice,
} from "@/lib/cms/content-formatters";
import { publicContentRepository } from "@/lib/cms/public-content-adapter";
import { resourceHref } from "@/lib/marketplace/public-content-types";

interface ResourceDetailProps {
  params: Promise<{ slug: string }>;
}

/**
 * Only published, reviewed resources are pre-rendered. That list is
 * currently empty, so no resource detail page is generated and every slug
 * falls through to `notFound()` — which is the correct behaviour, not a
 * defect.
 */
export async function generateStaticParams() {
  const { items } = await publicContentRepository.listArticles();
  return items.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ResourceDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await publicContentRepository.getArticle(slug);

  if (!article) {
    return { title: "Resource not found", robots: { index: false, follow: true } };
  }

  const canonical = resourceHref(article.slug);

  return {
    title: article.seo.title ?? article.title,
    description: article.seo.description ?? article.excerpt,
    alternates: { canonical },
    openGraph: {
      title: article.seo.title ?? article.title,
      description: article.seo.description ?? article.excerpt,
      url: canonical,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.reviewedAt ?? article.publishedAt,
    },
    /*
     * Indexable only because `getArticle` can return nothing but a
     * published, reviewed record — the repository filters before this code
     * runs, so there is no path by which a draft reaches this metadata.
     */
    robots: { index: true, follow: true },
  };
}

/**
 * Public resource detail.
 *
 * Reads through the public repository, which returns only published,
 * public-safe projections. The type it returns has no status, no author
 * subject and no internal note, so nothing administrative can be rendered
 * into this page or its metadata.
 *
 * No structured data is emitted. `Article` JSON-LD would be legitimate for
 * genuinely reviewed content, but it is only worth adding once real
 * published resources exist — emitting it now would describe nothing.
 */
export default async function ResourceDetailPage({ params }: ResourceDetailProps) {
  const { slug } = await params;
  const article = await publicContentRepository.getArticle(slug);

  if (!article) notFound();

  const dateline = contentDateline({
    publishedAt: article.publishedAt,
    reviewedAt: article.reviewedAt,
  });

  return (
    <>
      <section className="border-b border-border bg-tint/50">
        <Container className="flex flex-col gap-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Guides & Resources", href: "/resources" },
              { label: article.title },
            ]}
            structuredData
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2.5 py-1 text-caption font-medium text-navy">
              {article.category}
            </span>
            {article.jurisdictionLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-caption font-medium text-slate">
                <Scale className="h-3 w-3" aria-hidden />
                {article.jurisdictionLabel}
              </span>
            ) : null}
          </div>

          <h1 className="max-w-[28ch] text-hero font-semibold text-navy">{article.title}</h1>

          {article.excerpt ? (
            <p className="max-w-[70ch] text-lead text-slate">{article.excerpt}</p>
          ) : null}

          {/* Publish date and review date are shown separately and labelled
              distinctly — never merged, and never substituted for each
              other. The gap between them is information the reader needs. */}
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            {dateline.published ? (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-action" aria-hidden />
                <dt className="text-caption text-slate">Published</dt>
                <dd className="text-caption font-medium text-navy">{dateline.published}</dd>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-action" aria-hidden />
              <dt className="text-caption text-slate">Last reviewed</dt>
              <dd className="text-caption font-medium text-navy">
                {dateline.reviewed ?? "Not reviewed"}
                {article.reviewer && dateline.reviewed ? ` by ${article.reviewer}` : ""}
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex max-w-[76ch] flex-col gap-8">
          {article.featuredImage ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-tint">
              <Image
                src={article.featuredImage.path}
                alt={article.featuredImage.alt}
                fill
                priority
                sizes="(min-width: 1024px) 70vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <ContentBlocks blocks={article.body} />

          {article.jurisdictionLabel ? (
            <p className="rounded-card border border-border bg-tint/60 px-4 py-3 text-compact text-slate">
              {jurisdictionNotice(article.jurisdictionLabel)}
            </p>
          ) : null}

          <p className="border-t border-border pt-6 text-caption text-slate">
            {TAX_CONTENT_DISCLAIMER}
          </p>

          <Link href="/resources" className="text-compact font-semibold text-action">
            &larr; All guides and resources
          </Link>
        </Container>
      </section>

      <MarketplaceCta
        title="Need this applied to your own situation?"
        description="This guide describes how things generally work. Anything that depends on your circumstances needs a professional authorized for the jurisdiction you file in."
        primary={{ label: "Find an Accountant", href: "/find-accountant" }}
        secondary={{ label: "All resources", href: "/resources" }}
        note="Confirm authorization for your tax jurisdiction, the scope of the work and the fee directly with any professional you contact."
      />
    </>
  );
}
