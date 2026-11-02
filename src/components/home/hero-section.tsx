"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { AccountantSearch } from "@/components/shared/accountant-search";
import { Container } from "@/components/layout/container";
import { MarqueeBand } from "@/components/shared/marquee-band";
import { heroImage, heroTrustList } from "@/lib/home-content";
import { discoverableCountries } from "@/lib/marketplace/countries";
import { jurisdictionOptions } from "@/lib/directory/taxonomy";

/**
 * Hero — full-bleed photo background, centered content.
 *
 * Replaces the earlier asymmetric text/boxed-image split on explicit
 * request: the photo is now the section background rather than a framed
 * panel, and the content column is centered instead of left-aligned. A
 * navy scrim (`bg-navy/80` to `/60`, darker at the bottom where the search
 * card and trust list sit) guarantees the white text and the opaque white
 * search card both stay legible regardless of what the photo looks like
 * underneath — contrast is guaranteed by the overlay, not by hoping the
 * image is dark enough on its own.
 *
 * The "searchable today" stat chip and the oversized ghost numeral both
 * depended on the previous two-column grid (one anchored to the image
 * panel's corner, the other floated over the flat tint background) and
 * don't carry over to a single centered column over a photo — their real
 * counts (never invented, same catalogues as before) now live inline in
 * the subhead and the compact stat row under the search, so no figure is
 * dropped, just no longer floating off-layout.
 *
 * Still a Client Component for the staggered spring entrance — `variants`
 * /`staggerChildren` require parent and children in the same client tree.
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
    <section className="relative overflow-hidden border-b border-border">
      <Image
        src={heroImage.src}
        alt={heroImage.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Guarantees text/card contrast against whatever the photo contains —
          darker toward the bottom, where the opaque white search card and
          the trust list sit, lighter toward the top so the photo still
          reads as a photo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/75 to-navy/85"
      />

      <Container className="relative flex min-h-[640px] flex-col items-center justify-center gap-7 py-20 text-center sm:min-h-[720px] sm:py-28">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex w-full max-w-3xl flex-col items-center gap-7"
        >
          <motion.p variants={item} className="text-caption text-white/70">
            Global tax and accounting marketplace
          </motion.p>

          <motion.h1
            variants={item}
            className="max-w-[20ch] text-5xl font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Find a tax accountant authorised where you actually file
          </motion.h1>

          <motion.p variants={item} className="max-w-[52ch] text-lead text-white/80">
            Search {jurisdictionOptions.length} tax jurisdictions across{" "}
            {discoverableCountries.length} countries by service and language. Residence and
            authorisation are separate filters, because they are separate facts.
          </motion.p>

          <motion.div variants={item} className="w-full max-w-2xl">
            <AccountantSearch />
          </motion.div>

          <motion.div variants={item} className="w-full max-w-xl overflow-hidden">
            <MarqueeBand durationSeconds={24} className="text-compact font-mono text-white/60">
              {jurisdictionOptions.map((jurisdiction) => (
                <span key={jurisdiction.value} className="whitespace-nowrap">
                  {jurisdiction.value}
                </span>
              ))}
            </MarqueeBand>
          </motion.div>

          <motion.ul
            variants={item}
            className="grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-5 border-t border-white/15 pt-7 text-left sm:grid-cols-2"
          >
            {heroTrustList.map((trustItem) => (
              <li key={trustItem.title} className="flex flex-col gap-1">
                <p className="text-compact font-medium text-white">{trustItem.title}</p>
                <p className="text-caption text-white/70">{trustItem.description}</p>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </Container>
    </section>
  );
}
