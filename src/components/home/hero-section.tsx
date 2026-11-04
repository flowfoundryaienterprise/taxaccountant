"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { heroImage } from "@/lib/home-content";
import { cn } from "@/lib/utils";

/**
 * Hero — light, two-column layout: eyebrow + headline + copy + CTAs on the
 * left, a framed photo panel on the right. Replaces the previous full-bleed
 * dark-photo treatment on explicit design-reference request (approved
 * client mockup): a light background reads as the "premium light-blue"
 * direction the brief calls for, and a framed image panel leaves room for
 * the trust band directly beneath it instead of overlaying text on a photo.
 *
 * Still a Client Component for the staggered entrance — `variants`/
 * `staggerChildren` require parent and children in the same client tree.
 */

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-white">
      <Container className="grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex flex-col gap-6"
        >
          <motion.p
            variants={item}
            className="text-caption font-medium tracking-wide text-slate uppercase"
          >
            Expert tax &amp; accounting support
          </motion.p>

          <motion.h1
            variants={item}
            className="max-w-[16ch] text-5xl font-semibold leading-[1.05] tracking-tight text-navy sm:text-6xl"
          >
            Expert advice.
            <br />
            <span className="text-action">For every chapter.</span>
          </motion.h1>

          <motion.p variants={item} className="max-w-[48ch] text-lead text-slate">
            Explore accountants and tax professionals for your personal, business and
            cross-border needs.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/find-accountant"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Explore professionals
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/services"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              View services
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-panel border border-border shadow-[var(--shadow-float)]"
        >
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      </Container>
    </section>
  );
}
