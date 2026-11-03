import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { twoFactor } from "better-auth/plugins";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

/*
 * The one identity provider for the whole app — staff and public
 * customers/professionals alike. Identity/session/credential storage lives
 * entirely in this component's own tables; *role* is always looked up
 * separately, keyed by `identity.tokenIdentifier`, never trusted from a
 * client-supplied value (AGENTS.md section 5/6):
 *  - `staffMemberships` (`convex/staff.ts`) — CMS access, admin-provisioned
 *    only (ARCHITECTURE.md section 6, DAY6_ADMIN_CMS.md section 1).
 *  - `appUsers` (`convex/users.ts`) — public account, self-registered,
 *    auto-created on first sign-in (Phase 2, P2-W1, DATABASE.md section 3).
 *
 * `emailAndPassword` is the only method enabled (PRD.md's phase gates: no
 * OAuth/social sign-in has been approved). Having a Better Auth account is
 * necessary but never sufficient for anything privileged on its own — a
 * stray sign-up grants no CMS access without a `staffMemberships` row, and
 * grants only an ordinary customer `appUsers` row otherwise.
 */
const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  throw new Error(
    "SITE_URL is not set on this Convex deployment. Run `npx convex env set SITE_URL <url>` " +
      "(see convex/auth.ts) before the Better Auth component can issue correctly-scoped sessions.",
  );
}

export const authComponent = createClient<DataModel>(components.betterAuth);

/*
 * Resend sender for password-reset mail (Phase 2, P2-W1). `onboarding@resend.dev`
 * is Resend's own shared test address — works with no domain verification, swap
 * for a verified sending domain once one exists (documents/ARCHITECTURE.md
 * section 6, documents/API.md section 11).
 */
const RESEND_FROM_ADDRESS = "onboarding@resend.dev";

async function sendPasswordResetEmail(to: string, url: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is not set on this Convex deployment. Run `npx convex env set " +
        "RESEND_API_KEY <key>` (see convex/auth.ts) before password reset can send mail.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_ADDRESS,
      to,
      subject: "Reset your TaxAccountant.com password",
      html: `<p>Someone requested a password reset for this email address.</p><p><a href="${url}">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${body}`);
  }
}

/*
 * Staff MFA (Phase 2, P2-W1, docs/superpowers/specs/2026-11-03-staff-mfa-design.md).
 * Same Resend sender/limitation as sendPasswordResetEmail — a cms_admin
 * other than the Resend account's own verified address cannot currently
 * complete sign-in once they enable this, until a sending domain is
 * verified (documents/ARCHITECTURE.md section 6).
 */
async function sendTwoFactorOtpEmail(to: string, code: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is not set on this Convex deployment. Run `npx convex env set " +
        "RESEND_API_KEY <key>` (see convex/auth.ts) before MFA codes can send mail.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_ADDRESS,
      to,
      subject: "Your TaxAccountant.com sign-in code",
      html: `<p>Your sign-in code is:</p><p style="font-size:24px;font-weight:600;letter-spacing:4px;">${code}</p><p>This code expires shortly. If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${body}`);
  }
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(user.email, url);
      },
    },
    plugins: [
      convex({ authConfig }),
      twoFactor({
        otpOptions: {
          sendOTP: async ({ user, otp }) => {
            await sendTwoFactorOtpEmail(user.email, otp);
          },
        },
      }),
    ],
  });
};
