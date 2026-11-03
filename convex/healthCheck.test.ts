/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { register as registerBetterAuth } from "@convex-dev/better-auth/test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("status query runs", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.healthCheck.status, {});
  expect(result).toBeDefined();
});

test("devProvision.signUpStaff creates a Better Auth user inside the test harness", async () => {
  const t = convexTest(schema, modules);
  // The Better Auth component (`convex.config.ts`: `app.use(betterAuth)`)
  // has its own isolated tables/functions and must be registered on the
  // convexTest instance separately, per @convex-dev/better-auth's own
  // `./test` helper (see its `register()` in node_modules).
  registerBetterAuth(t);
  const result = await t.action(internal.devProvision.signUpStaff, {
    email: "smoke-test@example.com",
    password: "correct-horse-battery-staple",
    name: "Smoke Test",
  });
  expect(result.email).toBe("smoke-test@example.com");
});
