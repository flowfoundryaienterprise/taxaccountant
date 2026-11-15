import { api } from "@/convex/_generated/api";
import { publicConvexClient } from "@/lib/convex/public-client";

export async function loadDirectory() {
  const result = await publicConvexClient.query(api.professionals.publishedDirectory, {});
  return {...result,preview:false};
}
