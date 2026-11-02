"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider, type AuthClient } from "@convex-dev/better-auth/react";

import { authClient } from "@/lib/auth/client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ConvexClientProviderProps {
  children: React.ReactNode;
  /**
   * Read server-side from the session cookie (`src/lib/auth/server.ts`,
   * `getToken()`) and passed down from `RootLayout`, so the client starts
   * already knowing the auth state on first paint instead of flashing
   * "signed out" until the browser round-trips a token.
   */
  initialToken?: string | null;
}

export function ConvexClientProvider({ children, initialToken }: ConvexClientProviderProps) {
  if (!convexClient) {
    return <>{children}</>;
  }
  return (
    <ConvexBetterAuthProvider
      client={convexClient}
      // `@convex-dev/better-auth@0.12.6`'s `AuthClient` type is a union over
      // two plugin-array shapes built from `ReturnType<typeof
      // createAuthClient<...>>`; TypeScript collapses `useSession().data` to
      // `never` across that union even though both branches' `authClient`
      // (ours included) resolve it concretely at the type's own declaration
      // site — an upstream generic-inference limitation, not a runtime
      // mismatch. Narrow cast through `AuthClient`'s own declared shape.
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
