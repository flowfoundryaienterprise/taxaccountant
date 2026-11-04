"use node";

import { v } from "convex/values";

import { internalAction } from "./_generated/server";
import { createAuth } from "./auth";

/**
 * One-off bootstrap: creates the very first Better Auth staff account via
 * `npx convex run devProvision:signUpStaff '{"email":"...","password":"...","name":"..."}'`.
 * `internalAction` only — never reachable from the browser or any public
 * API surface. The created account still has no CMS access on its own;
 * sign in once through `/sign-in` and call the `staff:claimFirstStaffAccount`
 * mutation (or pick "CMS Admin" on the sign-up form, which calls the same
 * mutation) to attach the first `staffMemberships` row.
 */
export const signUpStaff = internalAction({
  args: { email: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const auth = createAuth(ctx);
    const result = await auth.api.signUpEmail({
      body: { email: args.email, password: args.password, name: args.name },
    });
    return { userId: result.user.id, email: result.user.email };
  },
});
