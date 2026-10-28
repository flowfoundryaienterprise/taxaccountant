import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/shared/reveal";
import { professionalCtaImage } from "@/lib/home-content";

export function ProfessionalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-panel bg-tint lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-start gap-6 p-8 sm:p-12">
            <h2 className="text-heading-lg font-semibold text-navy">Are You a Tax Professional?</h2>
            <p className="max-w-[56ch] text-lead text-slate">
              Join our global marketplace, reach new clients and grow your practice.
            </p>
            <Link
              href="/for-professionals"
              className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-input bg-action px-6 text-body font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0668c7] hover:shadow-[0_16px_32px_-18px_rgba(7,110,212,0.6)] active:translate-y-0 active:scale-[0.98]"
            >
              Join as a Professional
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>

          <div className="relative hidden aspect-[4/3] h-full min-h-64 w-full lg:block">
            <Image
              src={professionalCtaImage.src}
              alt={professionalCtaImage.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover"
            />
          </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
