import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { ConvexHttpClient } from "convex/browser";

import { GET } from "@/app/api/readiness/route";

test("readiness distinguishes unavailable Convex from a working dependency", async () => {
  const previous = process.env.NEXT_PUBLIC_CONVEX_URL;
  try {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    const unavailable = await GET();
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), {ok: false, dependency: "convex"});

    process.env.NEXT_PUBLIC_CONVEX_URL = "https://unit-test.convex.cloud";
    const query = mock.method(ConvexHttpClient.prototype, "query", async () => []);
    try {
      const ready = await GET();
      assert.equal(ready.status, 200);
      assert.deepEqual(await ready.json(), {ok: true, dependency: "convex"});
    } finally {
      query.mock.restore();
    }
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
    else process.env.NEXT_PUBLIC_CONVEX_URL = previous;
  }
});
