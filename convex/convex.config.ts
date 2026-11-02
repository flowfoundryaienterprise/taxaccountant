import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

/**
 * Mounts the Better Auth component (ARCHITECTURE.md section 6: "Better Auth
 * with official `@convex-dev/better-auth` integration"). Identity,
 * credentials and sessions live entirely inside this component's own
 * tables — `convex/schema.ts` never shadow-copies them (DATABASE.md
 * section 1). Role/permission data (`staffMemberships`) is a separate,
 * application-owned table keyed by the component's stable auth subject.
 */
const app = defineApp();
app.use(betterAuth);

export default app;
