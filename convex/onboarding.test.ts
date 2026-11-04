/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const draft = {step: 0, category: "cpa_accountant" as const, displayName: "Jane", businessName: "Jane CPA", bio: "", city: "", region: "", serviceIds: [], jurisdictionIds: [], credentials: [], remote: true};

test("complete onboarding requests review; enquiries stay private and require publication", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject: "provider", issuer: "https://example.convex.site"});
  const customer = t.withIdentity({subject: "buyer", issuer: "https://example.convex.site"});
  const stranger = t.withIdentity({subject: "stranger", issuer: "https://example.convex.site"});
  await owner.mutation(api.users.ensureAppUser, {role: "professional"});
  await customer.mutation(api.users.ensureAppUser, {role: "customer"});
  await stranger.mutation(api.users.ensureAppUser, {role: "customer"});
  const professionalId = await owner.mutation(api.professionalOwnership.beginOnboarding, {});
  const data = await t.run(async ctx => {
    const countryId = await ctx.db.insert("countries", {code:"US",name:"United States",defaultLocale:"en-US",displayCurrency:"USD",discoverable:true,onboardingEnabled:true,transactionEnabled:false,paymentEnabled:false,status:"published",updatedAt:Date.now()});
    const jurisdictionId = await ctx.db.insert("taxJurisdictions", {code:"US-FED",countryId,label:"US Federal",level:"national",active:true});
    const serviceId = await ctx.db.insert("serviceCategories", {slug:"tax",name:"Tax preparation",summary:"Tax",sortOrder:1,publicationStatus:"published",seo:{}});
    const profilePhotoId = await ctx.storage.store(new Blob(["test portrait"],{type:"image/png"}));
    await ctx.db.patch(professionalId,{profilePhotoId});
    return {countryId,jurisdictionId,serviceId};
  });
  await owner.mutation(api.professionalOwnership.saveOnboardingDraft,{professionalId,draft:{...draft,step:8,city:"New York",bio:"An independent accounting practice serving individual and business clients.",countryId:data.countryId,serviceIds:[data.serviceId],jurisdictionIds:[data.jurisdictionId],credentials:[{designation:"CPA",issuer:"State board"}]}});
  await owner.mutation(api.professionalOwnership.submitOnboarding,{professionalId});
  const profile = await t.run(ctx=>ctx.db.get(professionalId));
  expect(profile?.publicationStatus).toBe("review");
  expect(profile?.approvedProfile).toBe(false);
  expect(await t.query(api.professionals.publicProfile,{slug:profile!.slug})).toBeNull();
  expect(await owner.query(api.users.accountDestination,{})).toBe("/professional/dashboard");
  const enquiry = {professionalId,serviceId:data.serviceId,jurisdictionId:data.jurisdictionId,description:"I need help preparing my individual return this year."};
  await expect(customer.mutation(api.contact.createEnquiry,enquiry)).rejects.toThrow("not accepting");
  await t.run(ctx=>ctx.db.patch(professionalId,{publicationStatus:"published",approvedProfile:true}));
  const publicProfile=await t.query(api.professionals.publicProfile,{slug:profile!.slug});
  expect(publicProfile?.displayName).toBe("Jane");
  expect(publicProfile).not.toHaveProperty("onboardingDraft");
  expect(publicProfile).not.toHaveProperty("reviewFeedback");
  expect((await t.query(api.professionals.publishedDirectory,{})).items).toHaveLength(1);
  const enquiryId = await customer.mutation(api.contact.createEnquiry,enquiry);
  expect(await customer.query(api.contact.myEnquiries,{})).toHaveLength(1);
  expect(await stranger.query(api.contact.myEnquiries,{})).toEqual([]);
  await expect(stranger.query(api.contact.myEnquiries,{professionalId})).rejects.toThrow();
  await expect(stranger.mutation(api.contact.closeEnquiry,{enquiryId})).rejects.toThrow();
  expect(await owner.query(api.contact.myEnquiries,{professionalId})).toHaveLength(1);
  await owner.mutation(api.contact.closeEnquiry,{enquiryId});
  expect((await customer.query(api.contact.myEnquiries,{}))[0].status).toBe("closed");
  await owner.mutation(api.professionalOwnership.reopenForEditing,{professionalId});
  expect((await t.run(ctx=>ctx.db.get(professionalId)))?.approvedProfile).toBe(false);
  expect(await t.query(api.professionals.publicProfile,{slug:profile!.slug})).toBeNull();
  expect((await t.query(api.professionals.publishedDirectory,{})).items).toHaveLength(0);
});

test("onboarding resumes one owned draft and rejects access from another account", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject: "owner", issuer: "https://example.convex.site"});
  const other = t.withIdentity({subject: "other", issuer: "https://example.convex.site"});
  await owner.mutation(api.users.ensureAppUser, {role: "professional"});
  await other.mutation(api.users.ensureAppUser, {role: "professional"});
  expect(await owner.query(api.users.accountDestination, {})).toBe("/professional/onboarding");
  const professionalId = await owner.mutation(api.professionalOwnership.beginOnboarding, {});
  expect(await owner.mutation(api.professionalOwnership.beginOnboarding, {})).toBe(professionalId);
  await owner.mutation(api.professionalOwnership.saveOnboardingDraft, {professionalId, draft});
  expect((await owner.query(api.professionalOwnership.getOwnedProfile, {professionalId})).profile.onboardingDraft?.displayName).toBe("Jane");
  expect(await other.query(api.professionalOwnership.myProfiles, {})).toEqual([]);
  await expect(other.query(api.professionalOwnership.getOwnedProfile, {professionalId})).rejects.toThrow();
  await expect(other.mutation(api.professionalOwnership.saveOnboardingDraft, {professionalId, draft})).rejects.toThrow();
  await expect(owner.mutation(api.professionalOwnership.submitOnboarding, {professionalId})).rejects.toThrow("Complete all profile steps");
  await expect(owner.mutation(api.professionalOwnership.submitForReview, {professionalId})).rejects.toThrow("onboarding review screen");
  const profile = await t.run(ctx => ctx.db.get(professionalId));
  expect(profile?.publicationStatus).toBe("draft");
  expect(profile?.approvedProfile).toBe(false);
});

test("customer cannot begin professional onboarding or change an established role", async () => {
  const t = convexTest(schema, modules);
  const customer = t.withIdentity({subject: "customer", issuer: "https://example.convex.site"});
  await customer.mutation(api.users.ensureAppUser, {role: "customer"});
  await customer.mutation(api.users.ensureAppUser, {role: "professional"});
  expect(await customer.query(api.users.accountDestination, {})).toBe("/customer/dashboard");
  await expect(customer.mutation(api.professionalOwnership.beginOnboarding, {})).rejects.toThrow("service provider");
  expect(await t.query(api.users.accountDestination, {})).toBe("/login");
});

test("CMS editors cannot publish or read the administrator application queue", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject:"owner-editor-test",issuer:"https://example.convex.site"});
  await owner.mutation(api.users.ensureAppUser,{role:"professional"});
  const professionalId = await owner.mutation(api.professionalOwnership.beginOnboarding,{});
  const editor = t.withIdentity({subject:"editor",issuer:"https://example.convex.site"});
  await t.run(async ctx=>{
    await ctx.db.insert("staffMemberships",{authSubject:"https://example.convex.site|editor",role:"cms_editor",active:true,updatedAt:Date.now()});
    await ctx.db.patch(professionalId,{publicationStatus:"review"});
  });
  await expect(editor.mutation(api.staff.publishProfessional,{professionalId})).rejects.toThrow("administrator");
  await expect(editor.query(api.staff.applicationQueue,{status:"review"})).rejects.toThrow("Administrator");
  await expect(t.query(api.staff.applicationDetails,{professionalId})).rejects.toThrow();
});

test("suspended owners lose draft access", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject: "suspended", issuer: "https://example.convex.site"});
  await owner.mutation(api.users.ensureAppUser, {role: "professional"});
  const professionalId = await owner.mutation(api.professionalOwnership.beginOnboarding, {});
  await t.run(async ctx => {
    const user = await ctx.db.query("appUsers").first();
    if (!user) throw new Error("Missing test user");
    await ctx.db.patch(user._id, {accountStatus: "suspended"});
  });
  await expect(owner.query(api.professionalOwnership.getOwnedProfile, {professionalId})).rejects.toThrow();
  await expect(owner.mutation(api.professionalOwnership.saveOnboardingDraft, {professionalId, draft})).rejects.toThrow();
  expect(await owner.query(api.users.accountDestination, {})).toBe("/login?reason=inactive");
});

test("marketplace counts require staff and count only approved publication", async()=>{
  const t=convexTest(schema,modules);
  const owner=t.withIdentity({subject:"counts-owner",issuer:"https://example.convex.site"});
  await owner.mutation(api.users.ensureAppUser,{role:"professional"});
  const professionalId=await owner.mutation(api.professionalOwnership.beginOnboarding,{});
  await expect(owner.query(api.staff.marketplaceOverview,{})).rejects.toThrow();
  const admin=t.withIdentity({subject:"counts-admin",issuer:"https://example.convex.site"});
  await t.run(async ctx=>{
    await ctx.db.insert("staffMemberships",{authSubject:"https://example.convex.site|counts-admin",role:"cms_admin",active:true,updatedAt:Date.now()});
    await ctx.db.patch(professionalId,{publicationStatus:"published",approvedProfile:false});
  });
  expect((await admin.query(api.staff.marketplaceOverview,{})).published).toBe("0");
  await t.run(ctx=>ctx.db.patch(professionalId,{approvedProfile:true}));
  expect((await admin.query(api.staff.marketplaceOverview,{})).published).toBe("1");
  await expect(owner.query(api.staff.latestEnquiries,{})).rejects.toThrow();
});
