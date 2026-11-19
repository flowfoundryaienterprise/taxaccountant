import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

type AuthHelpers = ReturnType<typeof convexBetterAuthNextJs>;

function validUrl(raw: string | undefined, forbiddenSuffix?: string): raw is string {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash &&
      (!forbiddenSuffix || !url.hostname.endsWith(forbiddenSuffix));
  } catch {
    return false;
  }
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const configured = validUrl(convexUrl) && validUrl(convexSiteUrl, ".convex.cloud");
const auth: AuthHelpers | null = configured
  ? convexBetterAuthNextJs({convexUrl, convexSiteUrl})
  : null;

const unavailable = () => {
  throw new Error("Authentication is unavailable: Convex URLs are missing or invalid.");
};

export const handler: AuthHelpers["handler"] = auth?.handler ?? {
  GET: async () => new Response("Authentication is unavailable.", {status: 503}),
  POST: async () => new Response("Authentication is unavailable.", {status: 503}),
};
export const getToken: AuthHelpers["getToken"] = auth?.getToken ?? (async () => undefined);
export const isAuthenticated: AuthHelpers["isAuthenticated"] = auth?.isAuthenticated ?? (async () => false);
export const preloadAuthQuery = auth?.preloadAuthQuery ?? (unavailable as AuthHelpers["preloadAuthQuery"]);
export const fetchAuthQuery = auth?.fetchAuthQuery ?? (unavailable as AuthHelpers["fetchAuthQuery"]);
export const fetchAuthMutation = auth?.fetchAuthMutation ?? (unavailable as AuthHelpers["fetchAuthMutation"]);
export const fetchAuthAction = auth?.fetchAuthAction ?? (unavailable as AuthHelpers["fetchAuthAction"]);
