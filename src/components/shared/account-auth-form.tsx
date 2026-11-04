"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Briefcase, LogIn, ShieldCheck, User, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface AccountAuthFormProps {
  /** `signup` shows the name field, the role toggle, and a different submit label/copy. */
  mode: "signin" | "signup";
}

type AccountRole = "customer" | "professional" | "cms_admin";

function dashboardPathFor(role: AccountRole | string | undefined): string {
  if (role === "professional") return "/professional/dashboard";
  if (role === "cms_admin") return "/admin";
  return "/customer/dashboard";
}

/**
 * Public customer/professional account sign-in and sign-up (Phase 2, P2-W1).
 *
 * The same `authClient` the staff login form uses (`@/lib/auth/client`) —
 * one Better Auth instance for the whole app.
 *
 * ## Role-based redirect, including the CMS Admin option
 * Sign-up shows a Customer / Service Provider / CMS Admin toggle. The
 * first two redirect straight to their dashboard, which itself
 * provisions the `appUsers` row with that role during its own SSR (see
 * the comment on `/customer/dashboard`'s page for why).
 *
 * "CMS Admin" is **not** a fourth self-service role in that same sense —
 * the rest of this codebase deliberately keeps CMS access out of public
 * self-registration (`staffMemberships` is a separate table from
 * `appUsers`, gated by `requireStaff`, normally grown only by an existing
 * `cms_admin` using `addStaffByEmail`). What this toggle actually does is
 * call the *existing*, already-self-limiting bootstrap,
 * `claimFirstStaffAccount` (`convex/staff.ts`): it only ever succeeds for
 * the very first signed-in identity while `staffMemberships` is empty, and
 * throws for every call after that. The toggle itself only renders while
 * `staffBootstrapClaimed` reports `false`, so the option disappears from
 * the form entirely once someone has claimed it — the same "don't offer
 * what won't work" rule the public nav's locked items already follow.
 *
 * Sign-in has no role to read from the form, so it checks the signed-in
 * identity's actual state instead: `currentStaff` first (an active staff
 * membership always wins and goes to `/admin`), then `currentUser.role`,
 * defaulting to the customer dashboard for an account with neither.
 *
 * Both paths wait for `useConvexAuth().isAuthenticated` before navigating,
 * and navigate with `window.location.assign` rather than `router.push()` —
 * see the comment on the effect below for why.
 *
 * ## One shared login, not a separate `/staff-login`
 * `/admin/layout.tsx` redirects here (`/sign-in?intent=admin-dashboard`,
 * or `&reason=not-staff` for a session that's authenticated but has no
 * active `staffMemberships` row) rather than to a staff-only page — this
 * form already does everything that page did: sign-in redirects a staff
 * account to `/admin` on its own (the `currentStaff` check above), and the
 * "claim the first admin" bootstrap is the same `cms_admin` signup option
 * described above. The `reason=not-staff` block below is the one piece
 * that page had with no equivalent here otherwise: an explanation for a
 * signed-in person whose account genuinely has no CMS role, with the claim
 * button for the case where nobody has claimed it yet.
 *
 * MFA and password recovery are the rest of P2-W1 and aren't in this form
 * yet.
 */
export function AccountAuthForm({ mode }: AccountAuthFormProps) {
  const searchParams = useSearchParams();
  const notStaff = mode === "signin" && searchParams.get("reason") === "not-staff";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<AccountRole>("customer");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [awaitingRedirect, setAwaitingRedirect] = React.useState(false);
  const [claimingFromNotice, setClaimingFromNotice] = React.useState(false);
  const [claimNoticeError, setClaimNoticeError] = React.useState<string | null>(null);
  const claimAttempted = React.useRef(false);

  const { isAuthenticated } = useConvexAuth();
  const staffBootstrapClaimed = useQuery(
    api.staff.staffBootstrapClaimed,
    mode === "signup" || notStaff ? {} : "skip",
  );
  const claimFirstStaffAccount = useMutation(api.staff.claimFirstStaffAccount);

  async function handleClaimFromNotice() {
    setClaimingFromNotice(true);
    setClaimNoticeError(null);
    try {
      await claimFirstStaffAccount({});
      window.location.assign("/admin");
    } catch (err) {
      setClaimNoticeError(
        err instanceof Error ? err.message : "Could not claim the admin role — it may already be taken.",
      );
      setClaimingFromNotice(false);
    }
  }
  /*
   * If someone else claims the bootstrap between this form loading and the
   * person submitting, the toggle button disappears (it's conditional on
   * `staffBootstrapClaimed === false`) but `role` state can still be the
   * stale "cms_admin" selected before that. Deriving the effective role
   * here — rather than `setRole` from an effect — means a submit in that
   * window falls back to "customer" directly, instead of reaching
   * `handleSubmit`'s `cms_admin` branch and surfacing
   * `claimFirstStaffAccount`'s rejection as an error for a button the
   * person can no longer even see.
   */
  const effectiveRole: AccountRole = staffBootstrapClaimed && role === "cms_admin" ? "customer" : role;

  // Sign-up already knows its destination (`role` is form state) and
  // doesn't need `currentUser`/`currentStaff` at all; only sign-in queries
  // them, to read an existing account's actual state.
  const currentUser = useQuery(
    api.users.currentUser,
    mode === "signin" && awaitingRedirect && isAuthenticated ? {} : "skip",
  );
  const currentStaff = useQuery(
    api.staff.currentStaff,
    mode === "signin" && awaitingRedirect && isAuthenticated ? {} : "skip",
  );

  /*
   * Gated on `useConvexAuth().isAuthenticated`, not on the
   * `authClient.signUp`/`signIn` promise resolving — confirmed live, the
   * session cookie can already be set while this identity still isn't the
   * one Convex itself will attach to the very next request. `useConvexAuth()`
   * is the same reactive signal `EnsureAppUser` already relies on for the
   * equivalent problem, and it only flips `true` once Convex has actually
   * accepted the identity. `claimFirstStaffAccount` is called here for the
   * identical reason `ensureAppUser` can't be called straight from
   * `handleSubmit` — see that mutation's own comment.
   *
   * The navigation itself is `window.location.assign`, not `router.push()`
   * — a full top-level request, guaranteed to carry whatever cookie is in
   * the jar at that moment, rather than a client-side transition that can
   * still read a cached pre-auth response in this dev environment.
   */
  React.useEffect(() => {
    if (!awaitingRedirect || !isAuthenticated) return;

    if (mode === "signup") {
      if (effectiveRole === "cms_admin") {
        if (claimAttempted.current) return;
        claimAttempted.current = true;
        claimFirstStaffAccount({})
          .then(() => window.location.assign("/admin"))
          .catch((err) => {
            claimAttempted.current = false;
            setAwaitingRedirect(false);
            setError(
              err instanceof Error
                ? err.message
                : "Could not claim the admin role — it may already be taken.",
            );
          });
        return;
      }
      window.location.assign(dashboardPathFor(effectiveRole));
      return;
    }

    // Sign-in: an active staff membership always wins, regardless of
    // `appUsers.role` — a staff account may never have a public role set
    // at all.
    if (currentStaff === undefined || currentUser === undefined) return; // still loading
    window.location.assign(currentStaff ? "/admin" : dashboardPathFor(currentUser?.role));
  }, [awaitingRedirect, isAuthenticated, currentUser, currentStaff, mode, effectiveRole, claimFirstStaffAccount]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: name.trim() || email })
        : await authClient.signIn.email({ email, password });

    if (authError) {
      setSubmitting(false);
      setError(
        authError.message ??
          (mode === "signup"
            ? "Could not create an account with those details."
            : "Sign-in failed. Check the email and password and try again."),
      );
      return;
    }

    setAwaitingRedirect(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {notStaff ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-card border border-warning/30 bg-white px-4 py-3 text-compact text-slate"
        >
          <p>
            That account signed in, but has no active CMS role. Ask an existing{" "}
            <span className="font-medium text-navy">cms_admin</span> to add you from Admin → Staff.
          </p>
          {staffBootstrapClaimed === false ? (
            <>
              <p className="text-caption text-slate">
                No staff account exists yet on this deployment? The first signed-in account may claim
                <span className="font-medium text-navy"> cms_admin</span> once — this only works before
                any <code className="rounded bg-subtle px-1 py-0.5 font-mono text-navy">staffMemberships</code>{" "}
                row exists.
              </p>
              <button
                type="button"
                onClick={handleClaimFromNotice}
                disabled={claimingFromNotice}
                className="inline-flex h-10 w-fit items-center gap-1.5 rounded-input border border-control bg-white px-4 text-compact font-medium text-navy transition-colors duration-150 hover:bg-subtle disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4 text-action" aria-hidden />
                {claimingFromNotice ? "Claiming…" : "Claim first admin account"}
              </button>
              {claimNoticeError ? (
                <p role="alert" className="text-caption font-medium text-danger">
                  {claimNoticeError}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {mode === "signup" ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-slate">I'm signing up as a</span>
          <div className={cn("grid gap-2", staffBootstrapClaimed === false ? "grid-cols-3" : "grid-cols-2")}>
            <button
              type="button"
              onClick={() => setRole("customer")}
              aria-pressed={role === "customer"}
              className={cn(
                "flex items-center justify-center gap-2 rounded-input border px-3 py-2.5 text-compact font-medium transition-colors duration-150",
                role === "customer"
                  ? "border-action bg-tint text-action"
                  : "border-control bg-white text-navy hover:bg-subtle",
              )}
            >
              <User className="h-4 w-4" aria-hidden />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("professional")}
              aria-pressed={role === "professional"}
              className={cn(
                "flex items-center justify-center gap-2 rounded-input border px-3 py-2.5 text-compact font-medium transition-colors duration-150",
                role === "professional"
                  ? "border-action bg-tint text-action"
                  : "border-control bg-white text-navy hover:bg-subtle",
              )}
            >
              <Briefcase className="h-4 w-4" aria-hidden />
              Service Provider
            </button>
            {staffBootstrapClaimed === false ? (
              <button
                type="button"
                onClick={() => setRole("cms_admin")}
                aria-pressed={role === "cms_admin"}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-input border px-3 py-2.5 text-compact font-medium transition-colors duration-150",
                  role === "cms_admin"
                    ? "border-action bg-tint text-action"
                    : "border-control bg-white text-navy hover:bg-subtle",
                )}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                CMS Admin
              </button>
            ) : null}
          </div>
          <p className="text-caption text-slate/70">
            {role === "customer"
              ? "Find professionals and send enquiries once that's live."
              : role === "professional"
                ? "List your practice and receive enquiries once that's live."
                : "Claims the administrator role for this CMS. Only available once — before anyone else has."}
          </p>
        </div>
      ) : null}

      {mode === "signup" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-name" className="text-caption font-medium text-slate">
            Name
          </label>
          <input
            id="account-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-email" className="text-caption font-medium text-slate">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="account-password" className="text-caption font-medium text-slate">
          Password
        </label>
        <input
          id="account-password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-input border border-control bg-white px-3 text-compact text-navy transition-colors duration-150 hover:border-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        {mode === "signup" ? (
          <p className="text-caption text-slate/70">At least 8 characters.</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-caption font-medium text-danger">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || awaitingRedirect}
        className="w-full"
      >
        {mode === "signup" ? (
          <UserPlus className="h-4 w-4" aria-hidden />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden />
        )}
        {submitting || awaitingRedirect
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}
