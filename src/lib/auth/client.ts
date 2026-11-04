import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

/**
 * Browser-side Better Auth client — used by `/sign-in`'s `AccountAuthForm`
 * for every signed-in area of the site, staff included (there is no
 * separate staff login page or client). One Better Auth instance; which
 * role a signed-in identity has is an application-level lookup
 * (`staffMemberships` vs `appUsers`), not a client-side distinction.
 */
export const authClient = createAuthClient({
  plugins: [convexClient()],
});
