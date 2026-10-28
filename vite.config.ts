import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

/**
 * Day 6 addition: build-time exclusion of the Phase 1 CMS.
 *
 * ## Why this exists
 * No authentication or authorization exists in this project yet — there is
 * no Better Auth integration, no `convex/auth.config.ts`, and no
 * `ctx.auth` call anywhere (verified Day 6). The Day 6 brief is explicit:
 * "Do not deploy an unprotected admin dashboard" and "Keep all unfinished
 * CMS routes out of public production."
 *
 * A runtime `process.env` check inside a route is **not** sufficient: it was
 * measured, and vinext keeps such a check as a runtime lookup, so the entire
 * CMS component tree and its fixture data still ship inside the production
 * Worker bundle and merely refuse to render. Code that is present can be
 * reached by a bug, a misconfiguration or a stray env var.
 *
 * ## What this does
 * `vite.config.ts` runs in Node, so it can read the real shell environment
 * (application modules cannot — vinext only inlines `NEXT_PUBLIC_*`).
 * Unless `CMS_PREVIEW=enabled` is set for the build or dev command, every
 * module under `src/app/admin/` is replaced, before any other plugin sees
 * it, with a stub that calls `notFound()`. The CMS markup, its fixtures and
 * its components are then unreferenced and drop out of the bundle entirely.
 *
 * Verified: with the flag unset, no CMS string appears anywhere in
 * `.cloudflare/output/` and `/admin` returns HTTP 404 from the Workers
 * preview. With `CMS_PREVIEW=enabled`, the screens build and render.
 *
 * ## What this is NOT
 * This is a **development gate, not authorization**. It keeps unfinished
 * screens out of production; it does not make them safe to expose. Before
 * `/admin` may ever be enabled in a deployed environment it needs real
 * server-side authentication and role checks, and every read must be an
 * authorized Convex query. See docs/DAY6_ADMIN_CMS.md.
 */
const cmsPreviewEnabled = process.env.CMS_PREVIEW === "enabled";

const CMS_ROUTE_PREFIX = "/src/app/admin/";

const cmsProductionExclusion = {
  name: "cms-production-exclusion",
  // `pre` so the stub replaces the source before vinext's RSC transforms run.
  enforce: "pre" as const,
  transform(_code: string, id: string) {
    if (cmsPreviewEnabled) return null;

    // Normalize Windows separators so one plain substring test works on
    // every platform, rather than a regex full of escaped separators.
    const normalized = id.split("\\").join("/");
    if (!normalized.includes(CMS_ROUTE_PREFIX)) return null;
    if (!/\.tsx?$/.test(normalized)) return null;

    // Valid for both `page.tsx` and `layout.tsx`: the default export is a
    // component, and calling `notFound()` during render ends the route.
    return {
      code: `import { notFound } from "next/navigation";\nexport default function CmsExcludedFromProduction() { notFound(); }\n`,
      map: null,
    };
  },
};

export default defineConfig({
  plugins: [
    cmsProductionExclusion,
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
