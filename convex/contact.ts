import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query } from "./_generated/server";
import { requireStaff } from "./staff";
import { requireActiveUser } from "./users";
import { requireProfessionalEditAccess } from "./professionalOwnership";
import schema from "./schema";

/** Private enquiry contracts: identity and firm ownership are resolved on the server. */
export const myEnquiries = query({
  args: {professionalId: v.optional(v.id("professionals"))},
  returns: v.array(schema.doc("leads")),
  handler: async (ctx, {professionalId}) => {
    const user = await requireActiveUser(ctx);
    if (professionalId) {
      await requireProfessionalEditAccess(ctx, professionalId);
      return ctx.db.query("leads").withIndex("by_professional_status", q => q.eq("professionalId", professionalId)).order("desc").take(100);
    }
    return ctx.db.query("leads").withIndex("by_customer", q => q.eq("customerUserId", user._id)).order("desc").take(100);
  },
});

export const createEnquiry = mutation({
  args: {professionalId: v.id("professionals"), serviceId: v.id("serviceCategories"), jurisdictionId: v.id("taxJurisdictions"), description: v.string()},
  returns: v.id("leads"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    if (user.role !== "customer") throw new Error("A customer account is required.");
    const description = args.description.trim();
    if (description.length < 20 || description.length > 2000) throw new Error("Describe your enquiry in 20–2,000 characters.");
    const profile = await ctx.db.get(args.professionalId);
    if (!profile?.approvedProfile || profile.publicationStatus !== "published") throw new Error("This professional is not accepting enquiries.");
    const service = await ctx.db.get(args.serviceId);
    const jurisdiction = await ctx.db.get(args.jurisdictionId);
    const country = jurisdiction ? await ctx.db.get(jurisdiction.countryId) : null;
    if (service?.publicationStatus !== "published" || !jurisdiction?.active || country?.code !== "US" || !country.discoverable || country.status !== "published") throw new Error("Choose an available USA service and jurisdiction.");
    const offerings = await ctx.db.query("professionalServices").withIndex("by_professional", q => q.eq("professionalId", args.professionalId)).take(601);
    if (!offerings.some(o => o.serviceId === args.serviceId && o.taxJurisdictionId === args.jurisdictionId && o.enabled)) throw new Error("This professional does not offer the selected service in this jurisdiction.");
    return ctx.db.insert("leads", {...args, description, customerUserId: user._id, status: "new", createdAt: Date.now()});
  },
});

export const closeEnquiry = mutation({
  args: {enquiryId: v.id("leads")}, returns: v.null(),
  handler: async (ctx, {enquiryId}) => {
    const user = await requireActiveUser(ctx);
    const lead = await ctx.db.get(enquiryId);
    if (!lead) throw new Error("Enquiry not found.");
    const isCustomer = lead.customerUserId === user._id;
    if (!isCustomer) await requireProfessionalEditAccess(ctx, lead.professionalId);
    if (lead.status === "closed" || lead.status === "canceled") return null;
    await ctx.db.patch(enquiryId, {status: isCustomer ? "canceled" : "closed"});
    return null;
  },
});

/** Project public labels only; private onboarding drafts never leave this query. */
export const enquiryOptions = query({
  args: {}, returns: v.array(v.object({professionalId: v.id("professionals"), displayName: v.string(), serviceId: v.id("serviceCategories"), serviceName: v.string(), jurisdictionId: v.id("taxJurisdictions"), jurisdictionName: v.string()})),
  handler: async ctx => {
    await requireActiveUser(ctx);
    const profiles = await ctx.db.query("professionals").withIndex("by_publication_status", q => q.eq("publicationStatus", "published")).take(50);
    const result = [];
    for (const profile of profiles) {
      if (!profile.approvedProfile) continue;
      const offerings = await ctx.db.query("professionalServices").withIndex("by_professional", q => q.eq("professionalId", profile._id)).take(50);
      for (const offering of offerings) {
        if (!offering.enabled) continue;
        const service = await ctx.db.get(offering.serviceId);
        const jurisdiction = await ctx.db.get(offering.taxJurisdictionId);
        const country = jurisdiction ? await ctx.db.get(jurisdiction.countryId) : null;
        if (service?.publicationStatus !== "published" || !jurisdiction?.active || country?.code !== "US" || !country.discoverable || country.status !== "published") continue;
        result.push({professionalId: profile._id, displayName: profile.displayName, serviceId: service._id, serviceName: service.name, jurisdictionId: jurisdiction._id, jurisdictionName: jurisdiction.label});
        if (result.length === 100) return result;
      }
    }
    return result;
  },
});

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

/**
 * Staff-only read of submitted messages (DAY6_ADMIN_CMS.md's "Required
 * authorized functions" pattern, applied to the one collection that now
 * genuinely has rows). `requireStaff` throws for anyone without an active
 * `staffMemberships` row, so this is authorized in the query itself, not
 * just hidden behind the `/admin` route gate (AGENTS.md section 5: "No
 * client privilege from submitted role").
 */
export const listMessages = query({
  args: {
    status: v.optional(
      v.union(v.literal("new"), v.literal("reviewing"), v.literal("closed"), v.literal("spam")),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    if (args.status) {
      return ctx.db
        .query("publicMessages")
        .withIndex("by_status_created", (q) => q.eq("status", args.status!))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return ctx.db.query("publicMessages").withIndex("by_created").order("desc").paginate(args.paginationOpts);
  },
});

/**
 * Staff-only status transition, with an audit event — AGENTS.md section 5:
 * "Audit privileged content/verification/country/financial changes."
 * `publicMessages` holds a submitter's name, email and message text, so
 * reading or changing one is exactly the kind of access worth a record of
 * who did it and when, even though the message content itself is never
 * logged (AGENTS.md: "Do not log message text or private tax data").
 */
export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("publicMessages"),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("closed"), v.literal("spam")),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);

    const existing = await ctx.db.get(args.messageId);
    if (!existing) {
      throw new Error("Message not found.");
    }

    await ctx.db.patch(args.messageId, { status: args.status, updatedAt: Date.now() });

    await ctx.db.insert("auditEvents", {
      actorSubject: staff.authSubject,
      actorRole: staff.role,
      action: "publicMessage.statusChanged",
      resourceType: "publicMessages",
      resourceId: args.messageId,
      metadata: { from: existing.status, to: args.status },
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});
