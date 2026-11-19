import assert from "node:assert/strict";
import { test } from "node:test";

import { configuredOrigin, siteIsIndexable } from "@/lib/seo/site";

const production = "https://taxaccountant.flowfoundryai.in";

test("only the approved production origin is indexable", () => {
  assert.equal(siteIsIndexable(production, "production"), true);
  assert.equal(siteIsIndexable(production, "preview"), false);
  assert.equal(siteIsIndexable(null, "production"), false);
  assert.equal(siteIsIndexable("https://preview.example", "production"), false);
});

test("canonical origin rejects credentials, paths and non-http schemes", () => {
  assert.equal(configuredOrigin(`${production}/`), production);
  assert.equal(configuredOrigin(`${production}/wrong`), null);
  assert.equal(configuredOrigin("https://user:password@example.com"), null);
  assert.equal(configuredOrigin("javascript:alert(1)"), null);
});
