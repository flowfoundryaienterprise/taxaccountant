import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

/**
 * Browser-side Better Auth client. Used only by the staff sign-in form
 * (`/admin/login`) — there is no public account system yet (Phase 2).
 */
export const authClient = createAuthClient({
  plugins: [convexClient()],
});
