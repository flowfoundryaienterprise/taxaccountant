import { v } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Public contact / professional-interest intake (PRD.md P1-F08).
 *
 * `publicMessages` has existed in `convex/schema.ts` since the schema was
 * first drafted; this is the first mutation that writes to it. Anonymous
 * and public by design — this is not a privileged write, it is what a
 * contact form is for — but still validated and bounded server-side rather
 * than trusting the client.
 *
 * ## Anti-abuse, honestly scoped
 * Two lightweight, frontend-implementable checks: a honeypot field (a
 * form field invisible to a human, name deliberately generic) and a
 * minimum elapsed-time check (a bot that fills and submits in under a
 * second is almost certainly not reading the form). Neither requires a new
 * dependency. What this does **not** do: per-IP/per-email rate limiting or
 * cooldowns — Convex's own guidelines recommend `@convex-dev/rate-limiter`
 * for that rather than a hand-rolled counter (hand-rolled counters race
 * under concurrency), and installing a new component wasn't part of this
 * task. Recommended before this leaves Phase 1 preview.
 *
 * ## What this deliberately does not collect
 * No tax identifiers, no file upload, no bank details — PRD.md section 5
 * ("Minimize sensitive information: never ask for tax identifiers or tax
 * documents through public forms") and AGENTS.md section 1 forbid it.
 */
export const submitPublicMessage = mutation({
  args: {
    kind: v.union(v.literal("contact"), v.literal("professional_interest")),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    /*
     * No `serviceId` argument, even though `publicMessages.serviceId` in
     * the schema references `serviceCategories` — that table has no rows
     * yet (services are still `src/lib/marketplace/services.ts` fixtures,
     * not Convex-backed), so there is no valid ID a form could ever send.
     * The service of interest, when given, travels in `subject` as plain
     * text instead. Wire a real `serviceId` once `serviceCategories` is
     * populated.
     */
    subject: v.optional(v.string()),
    message: v.string(),
    consentVersion: v.string(),
    sourcePath: v.string(),
    /** Honeypot — must arrive empty. A bot that fills every field trips this. */
    companyWebsite: v.optional(v.string()),
    /** Client-measured ms between form mount and submit. */
    elapsedMs: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.companyWebsite && args.companyWebsite.trim().length > 0) {
      // Silently accept-and-drop rather than error — telling a bot it was
      // caught only teaches it to leave the honeypot blank next time.
      return { ok: true as const };
    }
    if (args.elapsedMs < 1500) {
      throw new Error("Please review the form and try again.");
    }

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const message = args.message.trim();

    if (name.length < 1 || name.length > 200) {
      throw new Error("Name must be between 1 and 200 characters.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    if (message.length < 10 || message.length > 4000) {
      throw new Error("Message must be between 10 and 4000 characters.");
    }
    const phone = args.phone?.trim();
    if (phone && phone.length > 40) {
      throw new Error("Phone number is too long.");
    }
    const subject = args.subject?.trim();
    if (subject && subject.length > 200) {
      throw new Error("Subject is too long.");
    }

    const now = Date.now();
    await ctx.db.insert("publicMessages", {
      kind: args.kind,
      name,
      email,
      phone: phone || undefined,
      subject: subject || undefined,
      message,
      consentVersion: args.consentVersion,
      sourcePath: args.sourcePath,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true as const };
  },
});
