"use client";

import * as React from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

/**
 * Provisions the signed-in caller's `appUsers` row (Phase 2, P2-W1,
 * `convex/users.ts`'s `ensureAppUser`) as a side effect of Convex's own
 * auth state, not of any one sign-in form's submit handler.
 *
 * Belt-and-braces only: `/customer/dashboard` and `/professional/dashboard`
 * (the only screens a fresh sign-up lands on today) each call
 * `fetchAuthMutation(api.users.ensureAppUser, { role })` themselves during
 * SSR — see the comment there for why relying on *this* component's effect
 * to have already run before that first render was the actual bug behind
 * a brand-new account bouncing back to `/sign-in`. This component still
 * matters for any other authenticated screen reached without going through
 * one of those two pages first (a straight `/sign-in` deep link, for
 * instance), so every `appUsers`-dependent query still has a row to find
 * once Convex's reactivity catches up, without each of those screens
 * needing its own provisioning call.
 *
 * ## Two bugs, and why this landed on `useQuery`, not `useConvexAuth` alone
 * First attempt called `ensureAppUser` from `AccountAuthForm`'s submit
 * handler, right after `authClient.signUp`/`signIn` resolved — confirmed
 * live (Convex dashboard `appUsers` table) that the resulting row was keyed
 * to whichever identity the Convex client's cached token *still* held at
 * that exact moment, not the one that had just signed in: the WebSocket's
 * token refresh is not synchronous with the Better Auth promise resolving.
 *
 * Second attempt moved the call here, gated on
 * `useConvexAuth().isAuthenticated` transitioning to `true` in a `useEffect`
 * — also confirmed live to reproduce the same wrong-identity row, for a
 * different reason: `isAuthenticated` is a boolean, so switching from one
 * already-authenticated identity to another (sign out one account, sign
 * into a different one, all in the same tab) never crosses a false→true
 * edge, and the effect simply never re-ran.
 *
 * `useQuery(api.users.currentUser)` doesn't have either problem: Convex
 * re-subscribes it to whatever identity the client is *actually* using
 * right now, on every token change, including a swap between two
 * authenticated identities. Reacting to its result (`null` while
 * authenticated means "no row for this exact identity yet") is therefore
 * the one signal that's actually correct for every case this needs to
 * cover, verified live after this rewrite: signing up as a second distinct
 * account while already signed in as a first one now provisions the
 * second account's own row, not the first's.
 *
 * No `role` argument here — a row this component creates (one not reached
 * through either dashboard first) has no role to set, same as it never did
 * before role existed on the schema.
 */
export function EnsureAppUser() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const ensureAppUser = useMutation(api.users.ensureAppUser);

  React.useEffect(() => {
    if (!isAuthenticated || currentUser !== null) return;
    ensureAppUser({}).catch(() => {
      // Best-effort. If this fails, `currentUser` stays `null` and every
      // appUsers-dependent screen gates through `requireActiveUser`
      // (convex/users.ts) itself rather than trusting this effect ran.
    });
  }, [isAuthenticated, currentUser, ensureAppUser]);

  return null;
}
