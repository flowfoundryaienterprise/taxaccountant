import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { MagneticCta } from "@/components/shared/magnetic-cta";
import { Reveal } from "@/components/shared/reveal";
import { professionalCtaImage } from "@/lib/home-content";

export function ProfessionalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-panel bg-tint lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-start gap-6 p-8 sm:p-12">
            <h2 className="text-heading-lg font-semibold text-navy">Listing a practice</h2>
            <p className="max-w-[56ch] text-lead text-slate">
              Register the jurisdictions you are authorised in, the services you cover and the
              languages you advise in. Listings open before public accounts do.
            </p>
            <MagneticCta>
              <Link
                href="/for-professionals"
                className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-input bg-action px-6 text-body font-medium text-white transition-colors duration-150 hover:bg-[#0668c7] active:scale-[0.98]"
              >
                Register a practice
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </MagneticCta>
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
