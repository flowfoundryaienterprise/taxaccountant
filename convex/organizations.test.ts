/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function signedInUser(t: ReturnType<typeof convexTest>, email: string) {
  const asUser = t.withIdentity({ subject: email, issuer: "https://example.convex.site" });
  await asUser.mutation(api.users.ensureAppUser, {});
  return asUser;
}

test("createOrganization makes the caller the owner", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "firm-owner@example.com");

  const { organizationId } = await asUser.mutation(api.organizations.createOrganization, {
    name: "Acme Tax LLP",
    kind: "professional_firm",
  });

  const orgs = await asUser.query(api.organizations.currentOrganizations, {});
  expect(orgs).toHaveLength(1);
  expect(orgs[0]).toMatchObject({ organizationId, name: "Acme Tax LLP", role: "owner" });
});

test("currentOrganizations is empty for a user with no org", async () => {
  const t = convexTest(schema, modules);
  const asUser = await signedInUser(t, "nobody@example.com");
  expect(await asUser.query(api.organizations.currentOrganizations, {})).toEqual([]);
});

test("createOrganization requires sign-in", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.organizations.createOrganization, { name: "X", kind: "customer_business" }),
  ).rejects.toThrow();
});
