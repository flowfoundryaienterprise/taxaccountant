import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { createAuth } from "./auth";

export const probe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const authContext = await createAuth(ctx).$context;
    const user = await authContext.adapter.findOne<{ id: string; email: string; name: string }>({
      model: "user",
      where: [{ field: "email", value: args.email }],
    });
    return {
      siteUrl: process.env.CONVEX_SITE_URL ?? null,
      userId: user?.id ?? null,
    };
  },
});
