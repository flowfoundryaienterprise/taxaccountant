import assert from "node:assert/strict";
import { test } from "node:test";

import { publicConvexClient } from "@/lib/convex/public-client";

test("public client reports missing and invalid deployment URLs", () => {
  const previous = process.env.NEXT_PUBLIC_CONVEX_URL;
  try {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    assert.throws(publicConvexClient, /not configured/);
    process.env.NEXT_PUBLIC_CONVEX_URL = "not-a-url";
    assert.throws(publicConvexClient, /invalid/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
    else process.env.NEXT_PUBLIC_CONVEX_URL = previous;
  }
});
