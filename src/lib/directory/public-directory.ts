import { api } from "@/convex/_generated/api";
import { publicConvexClient } from "@/lib/convex/public-client";
import { directoryFixtures } from "./fixtures";

export async function loadDirectory() {
  if (process.env.NODE_ENV !== "production") return {items:directoryFixtures,limited:false,preview:true};
  const result = await publicConvexClient.query(api.professionals.publishedDirectory, {});
  return {...result,preview:false};
}
