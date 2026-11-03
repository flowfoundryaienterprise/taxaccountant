# Staff MFA (email one-time code) — design

**Size:** a project. **Status:** drafted, pending builder check then owner approval.

## Intent / why

The other half of P2-W1 (`documents/ARCHITECTURE.md` section 6: "Privileged
staff MFA should be required when supported by validated Better Auth
plugin setup"). `cms_admin` is the role that can grant and revoke
everyone else's CMS access (`/admin/staff`, shipped this session) — the
highest-value target for account-takeover protection in this app. This
slice makes MFA real for that role specifically, using Better Auth's
`twoFactor` plugin, which exists in `node_modules` but has never been
mounted.

## Goals

- Any signed-in staff member (`cms_admin` or `cms_editor`) can enable or
  disable MFA on their own account from a new `/admin/security` screen.
- A `cms_admin` without MFA enabled sees a persistent, dismissible-per-session
  reminder across `/admin`, linking to that screen — not a block.
- Once enabled, signing in requires a second step: an emailed one-time
  code (or a backup code), before reaching `/admin`. This works correctly
  from **both** sign-in entry points — `/staff-login` and the public
  `/sign-in` — since staff and public accounts share one Better Auth
  instance and a staff member can land on either form (see "Builder
  check findings" below; confirmed with the owner to build both rather
  than redirect).
- A `cms_admin` can disable another staff member's MFA from
  `/admin/staff`, for when someone loses access to both their email and
  their backup codes — audited the same way every other action on that
  screen is.

## Non-goals / anti-goals

- Not required for `cms_editor` — optional only, never nagged.
- Not for public (`appUsers`) accounts at all, this slice.
- Not hard-blocking sign-in on enrollment (confirmed with the owner:
  reminder, not a forced setup flow).
- Not building a TOTP-authenticator-app UI, even though the underlying
  plugin generates a TOTP secret internally (see Constraints) — we never
  surface a QR code.

## Constraints

- **Known, accepted gap, same shape as the password-reset one:** email
  delivery goes through the same Resend wiring as password reset
  (`convex/auth.ts`'s `RESEND_API_KEY`, sender `onboarding@resend.dev`).
  That sender only delivers to the Resend account owner's own verified
  email until a sending domain is verified. **Concretely: every
  `cms_admin` other than `sriharsha0413@gmail.com` will be unable to
  complete sign-in once MFA is enabled on their account**, until that
  domain-verification work happens. Confirmed explicitly with the owner
  before choosing this approach over TOTP, which has no such dependency.
  Document this as plainly as the password-reset gap is documented, don't
  let it hide.
- Better Auth's `twoFactor` plugin always generates a TOTP secret and
  `totpURI` on `enableTwoFactor`, regardless of which verification method
  (TOTP app, email OTP, backup codes) the UI actually offers — "the otp
  adapter is created from the totp adapter" (plugin's own source comment).
  We simply never show the `totpURI`/QR code in our UI; only backup codes
  and the email-OTP path.
- The plugin manages its own `twoFactor` table inside the Better Auth
  component (same mechanism as `user`/`session`/`account`) — no change to
  `convex/schema.ts`.
- Server-side authorization only, same as every other boundary in this
  CMS: the reminder banner being hidden, or the reset button only
  appearing for a `cms_admin`, is never the actual security boundary. The
  admin-reset mutation re-checks `cms_admin` itself.

## Approaches (decided in conversation)

Two ways to do the actual second-factor check, both available from the
same plugin:

- **TOTP (authenticator app) — not chosen.** No email dependency, works
  for every admin today. Declined because the owner explicitly chose
  email OTP instead, with the Resend limitation above stated plainly
  first.
- **Email one-time code (`otpOptions.sendOTP`) — chosen.** Lower setup
  friction (no authenticator app), reuses the Resend wiring already
  built for password reset. Accepted trade-off: the known delivery gap
  above, and a weaker security property than an authenticator app (an
  attacker with mailbox access defeats it) — acceptable for this slice
  per the owner's explicit choice.

## The how (decided)

- **`convex/auth.ts`:** mount `twoFactor({ otpOptions: { sendOTP:
  async ({ user, otp }) => { /* send via Resend, same pattern as
  sendPasswordResetEmail */ } } })`.
- **`src/lib/auth/client.ts`:** add `twoFactorClient()` to the plugins
  array (needed for `authClient.twoFactor.*` methods to exist/typecheck,
  same reasoning as `convexClient()` already there).
- **`/admin/security`** (new, reachable by any signed-in staff member —
  not gated to `cms_admin`, since enabling MFA is opt-in for everyone and
  only the *requirement* is role-specific): shows current status
  (enabled/disabled), an enroll flow (call `enableTwoFactor({ password
  })`, show backup codes once with a copy/download action, confirm via
  the email-OTP verify step before treating it as active), and a disable
  action (`disableTwoFactor({ password })`).
  - **Lockout risk, addressed with warning copy only, not a block**
    (confirmed with the owner, raised by the builder check): if the only
    active `cms_admin` enables email-code MFA and isn't the Resend
    account's own verified address, they could be locked out of `/admin`
    with no recovery path — `adminResetTwoFactor` is `cms_admin`-only, and
    they'd be the only one. The enroll flow must show this plainly before
    the user confirms (something like: "Sign-in codes are emailed through
    a shared sending address that currently only reaches one verified
    inbox. If you're not sure this will reach you, and no other admin can
    reset this for you, you could lock yourself out.") — but the owner
    chose not to block on it, so the enroll action itself must remain
    available regardless of admin count or which address is signed in.
- **Reminder banner:** rendered in `AdminShell` or `AdminHeader`, visible
  only when the signed-in identity is `cms_admin` and the Better Auth
  user record's `twoFactorEnabled` is falsy. Links to `/admin/security`.
  Dismiss state can be session-only (my call, not durable — simplest
  option that still nags on the next sign-in) unless the builder finds
  that insufficient.
- **Shared two-factor verification step, used by both forms:** a small
  component/hook (name and exact placement left to the builder, e.g.
  `src/components/shared/two-factor-verify-step.tsx`) encapsulating:
  trigger `authClient.twoFactor.sendOtp()` on arrival, collect the code,
  call `authClient.twoFactor.verifyOtp({ code })` (or the backup-code
  verify endpoint via a "use a backup code instead" link) to complete
  sign-in. Both `staff-login-form.tsx` and
  `src/components/shared/account-auth-form.tsx` check their
  `signIn.email(...)` response for `twoFactorRedirect` and, if true,
  render this shared step instead of proceeding — closing the gap the
  builder check found: today `account-auth-form.tsx` only checks
  `authError`, and a `twoFactorRedirect` response has no `error` field,
  so an MFA-enabled staff member landing on the public `/sign-in` form
  would silently be told they're signed in while they are not (their
  session cookie was deleted and replaced by a pending-2FA cookie).
  Confirmed with the owner: build the real verification step into both
  forms rather than redirecting staff away from the public form.
- **`convex/staff.ts`:** new `cms_admin`-only mutation (name left to the
  builder, e.g. `adminResetTwoFactor`) that clears a target staff
  member's MFA state directly via the Better Auth adapter (same
  `createAuth(ctx).$context.adapter` access pattern `addStaffByEmail`
  already uses) — not through `disableTwoFactor`, which only operates on
  the caller's own session and requires their password. Audited
  (`staff.mfaReset` or similar, matching the existing `staff.*` audit
  vocabulary). **My call** (flagged by the builder check as minor, not
  brought to the owner): refuse to target the caller's own row. The
  design frames this action as being for *another* locked-out staff
  member, `disableTwoFactor` already exists as the intentional
  self-service path (and requires a password, which this adapter-level
  path does not), and every other self-targeting case in this file
  (`changeStaffRole`, `setStaffActive`) is only ever reachable alongside
  a real safeguard (the last-admin guard) — this action has none, so
  letting it target yourself would be a strictly weaker, inconsistent
  bypass of `disableTwoFactor`'s own password check.
- **`admin-staff-client.tsx` / `/admin/staff`:** add a reset-MFA action
  per row, visible to `cms_admin`, calling the mutation above.

## Known technical unknowns (resolve during build, don't block approval)

1. Whether `enableTwoFactor` requires an explicit verify call before
   `twoFactorEnabled` flips true on the user record by default (the
   plugin has a `skipVerificationOnEnable`-shaped option — exact default
   behavior wasn't pinned down in this conversation), and which verify
   endpoint applies for the email-OTP path specifically. Affects the
   enrollment screen's exact step sequence. **Still open** — the builder
   check didn't resolve this one; confirm from
   `node_modules/better-auth/dist/plugins/two-factor/index.mjs`'s
   `enableTwoFactor` handler directly.
2. ~~The Better Auth component's internal `twoFactor` table's exact
   field shape~~ — **resolved by the builder check**:
   `node_modules/@convex-dev/better-auth/src/component/schema.ts`
   already defines `user.twoFactorEnabled` and a `twoFactor` table with
   `secret`/`backupCodes`/`userId`/`verified` fields.
3. ~~Confirm `twoFactorEnabled` is present on what
   `authComponent.getAuthUser(ctx)` returns~~ — **resolved**, same
   schema reference as above.
4. The builder check also confirmed `disableTwoFactor` only needs a
   password plus an already-authenticated session (not an OTP), which
   the design's "how" section already assumed correctly.

## What's left to the builder

Everything in "Known technical unknowns" above, plus ordinary
implementation choices (exact component file layout, copy/wording,
exact audit action-name strings) — same latitude Task 1-4 of the
staff-management-ui plan had.
