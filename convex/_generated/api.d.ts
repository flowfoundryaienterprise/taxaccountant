/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cms from "../cms.js";
import type * as contact from "../contact.js";
import type * as content from "../content.js";
import type * as devProvision from "../devProvision.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as organizations from "../organizations.js";
import type * as professionalOwnership from "../professionalOwnership.js";
import type * as professionals from "../professionals.js";
import type * as staff from "../staff.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cms: typeof cms;
  contact: typeof contact;
  content: typeof content;
  devProvision: typeof devProvision;
  healthCheck: typeof healthCheck;
  http: typeof http;
  organizations: typeof organizations;
  professionalOwnership: typeof professionalOwnership;
  professionals: typeof professionals;
  staff: typeof staff;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
