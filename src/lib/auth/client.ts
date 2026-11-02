import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

/**
 * Browser-side Better Auth client — shared by the staff sign-in form
 * (`/staff-login`) and the public account forms (`/sign-in`,
 * `AccountAuthForm`). One Better Auth instance, used by both; which role a
 * signed-in identity has is an application-level lookup
 * (`staffMemberships` vs `appUsers`), not a client-side distinction.
 */
export const authClient = createAuthClient({
  plugins: [convexClient()],
});
