import { api } from "@/convex/_generated/api";
import { publicConvexClient } from "@/lib/convex/public-client";

/** Dependency probe; /api/health remains a process-only liveness check. */
export async function GET() {
  try {
    await publicConvexClient().query(api.taxonomy.listServiceCategories, {});
    return Response.json({ok: true, dependency: "convex"}, {headers: {"Cache-Control": "no-store"}});
  } catch {
    return Response.json({ok: false, dependency: "convex"}, {
      status: 503, headers: {"Cache-Control": "no-store"},
    });
  }
}
