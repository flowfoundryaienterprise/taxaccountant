import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PortraitImage } from "@/components/shared/portrait-image";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { testimonials } from "@/lib/home-content";

export function TestimonialsSection() {
  return (
    <section className="bg-tint py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Client testimonials"
            title="What Our Clients Say"
          />
          <Link
            href="/find-accountant"
            className="inline-flex shrink-0 items-center gap-1.5 text-compact font-semibold text-action"
          >
            View All Reviews
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.id} delayMs={index * 90}>
              <div className="flex h-full flex-col gap-4 rounded-card border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_-26px_rgba(16,44,87,0.3)]">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-warning text-warning" aria-hidden />
                  ))}
                </div>
                <p className="text-compact text-slate">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
                  <PortraitImage
                    src={testimonial.photo}
                    alt={testimonial.photoAlt}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                  />
                  <div>
                    <p className="text-compact font-semibold text-navy">{testimonial.name}</p>
                    <p className="text-caption text-slate">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
