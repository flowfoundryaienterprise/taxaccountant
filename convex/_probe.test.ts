/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { register as registerBetterAuth } from "@convex-dev/better-auth/test";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("probe env and user id", { timeout: 20000 }, async () => {
  const t = convexTest(schema, modules);
  registerBetterAuth(t);
  await t.action(internal.devProvision.signUpStaff, {
    email: "probe@example.com",
    password: "correct-horse-battery-staple",
    name: "Probe",
  });
  const result = await t.mutation(api._probe.probe, { email: "probe@example.com" });
  throw new Error("PROBE RESULT " + JSON.stringify(result));
});
