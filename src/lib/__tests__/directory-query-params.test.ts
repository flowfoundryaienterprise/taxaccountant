import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_MODE,
  DEFAULT_SORT,
  MAX_QUERY_LENGTH,
  buildDirectoryHref,
  clearAllHref,
  hasActiveFilters,
  parseDirectoryFilters,
  toDirectorySearchParams,
} from "@/lib/directory/query-params";
import { EMPTY_FILTERS } from "@/lib/directory/query-params";

/**
 * The directory URL contract. The URL is the entire filter store, so these
 * helpers decide whether a shared link, a refresh and a Back press all mean
 * the same search. Day 9 brief section 18: search query parsing, filter
 * serialization and pagination.
 */

test("keyword is trimmed and length-bounded", () => {
  assert.equal(parseDirectoryFilters({ q: "  sarah  " }).q, "sarah");
  assert.equal(parseDirectoryFilters({ q: "x".repeat(500) }).q.length, MAX_QUERY_LENGTH);
  assert.equal(parseDirectoryFilters({}).q, "");
});

test("a repeated param and the comma form parse identically", () => {
  const repeated = parseDirectoryFilters({ country: ["US", "CA"] });
  const comma = parseDirectoryFilters({ country: "US,CA" });
  assert.deepEqual(repeated.countries, comma.countries);
  assert.deepEqual(comma.countries, ["US", "CA"]);
});

test("unknown taxonomy values are dropped rather than throwing", () => {
  const filters = parseDirectoryFilters({
    country: "US,ZZ",
    service: "not-a-service",
    language: "xx",
    jurisdiction: "NOPE",
  });

  assert.deepEqual(filters.countries, ["US"], "valid code kept, unknown dropped");
  assert.deepEqual(filters.services, []);
  assert.deepEqual(filters.languages, []);
  assert.deepEqual(filters.jurisdictions, []);
});

test("duplicate values collapse", () => {
  assert.deepEqual(parseDirectoryFilters({ country: "US,US,CA" }).countries, ["US", "CA"]);
});

test("invalid mode, sort and page fall back to defaults", () => {
  const filters = parseDirectoryFilters({ mode: "telepathy", sort: "bogus", page: "abc" });
  assert.equal(filters.mode, DEFAULT_MODE);
  assert.equal(filters.sort, DEFAULT_SORT);
  assert.equal(filters.page, 1);
});

test("page is clamped to a positive integer", () => {
  for (const page of ["0", "-3", "abc", "", "NaN"]) {
    assert.equal(parseDirectoryFilters({ page }).page, 1, `page=${page}`);
  }
  assert.equal(parseDirectoryFilters({ page: "4" }).page, 4);
});

test("serialization omits defaults so Clear All yields a bare path", () => {
  const params = toDirectorySearchParams(EMPTY_FILTERS);
  assert.equal(params.toString(), "");
  assert.equal(clearAllHref(EMPTY_FILTERS), "/find-accountant");
});

test("Clear All keeps sort but drops every filter axis", () => {
  const href = clearAllHref({
    ...EMPTY_FILTERS,
    q: "sarah",
    countries: ["US"],
    services: ["payroll-services"],
    mode: "remote",
    sort: "name-desc",
  });

  assert.equal(href, "/find-accountant?sort=name-desc");
});

test("changing any filter resets pagination, changing the page does not", () => {
  const onPageFour = { ...EMPTY_FILTERS, page: 4, countries: ["US"] };

  assert.ok(
    !buildDirectoryHref(onPageFour, { services: ["payroll-services"] }).includes("page="),
    "a new filter must return to page 1",
  );
  assert.ok(buildDirectoryHref(onPageFour, { page: 5 }).includes("page=5"));
});

test("query strings are encoded", () => {
  const href = buildDirectoryHref(EMPTY_FILTERS, { q: "a&b=c d" });
  assert.ok(!href.includes("a&b=c d"), "raw delimiters must not survive");
  assert.ok(href.includes("q=a%26b%3Dc+d"));
});

test("round trip: parse(serialize(filters)) === filters", () => {
  const filters = {
    ...EMPTY_FILTERS,
    q: "international tax",
    countries: ["US", "CA"],
    services: ["payroll-services"],
    languages: ["en"],
    mode: "remote" as const,
    sort: "name-desc" as const,
    page: 3,
  };

  const raw = Object.fromEntries(toDirectorySearchParams(filters).entries());
  assert.deepEqual(parseDirectoryFilters(raw), filters);
});

test("hasActiveFilters ignores sort and page", () => {
  assert.equal(hasActiveFilters(EMPTY_FILTERS), false);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, sort: "name-desc", page: 5 }), false);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, q: "x" }), true);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, mode: "remote" }), true);
});
