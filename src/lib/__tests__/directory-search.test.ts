import test from "node:test";
import assert from "node:assert/strict";

import { PAGE_SIZE, EMPTY_FILTERS } from "@/lib/directory/query-params";
import { directoryFixtures } from "@/lib/directory/fixtures";
import { allCityTokens, availableCities, searchDirectory } from "@/lib/directory/filters";

/** Filtering, sorting and pagination over the directory data set. */

const search = (patch: Partial<typeof EMPTY_FILTERS> = {}) =>
  searchDirectory(directoryFixtures, { ...EMPTY_FILTERS, ...patch });

test("an empty search returns every row, paginated", () => {
  const results = search();
  assert.equal(results.total, directoryFixtures.length);
  assert.equal(results.items.length, Math.min(PAGE_SIZE, directoryFixtures.length));
  assert.equal(results.pageCount, Math.ceil(directoryFixtures.length / PAGE_SIZE));
});

test("keyword matching is case-insensitive and requires every term", () => {
  const lower = search({ q: "sarah" }).total;
  assert.equal(search({ q: "SARAH" }).total, lower);
  assert.equal(search({ q: "  sarah  " }).total, lower);
  assert.ok(lower > 0);

  // Both terms must appear, so an impossible pair matches nothing.
  assert.equal(search({ q: "sarah zzzzqqq" }).total, 0);
});

test("a no-results query returns an empty page, not an error", () => {
  const results = search({ q: "zzzzqqq" });
  assert.equal(results.total, 0);
  assert.deepEqual(results.items, []);
  assert.equal(results.pageCount, 1, "an empty result set is still one page");
});

test("country and service narrow the set, and combine", () => {
  const us = search({ countries: ["US"] });
  const payroll = search({ services: ["payroll-services"] });
  const both = search({ countries: ["US"], services: ["payroll-services"] });

  assert.ok(us.total > 0 && payroll.total > 0);
  assert.ok(both.total <= Math.min(us.total, payroll.total));
  for (const row of us.items) assert.equal(row.countryCode, "US");
});

test("consultation mode filters on the row's own flags", () => {
  for (const row of search({ mode: "remote" }).items) assert.equal(row.remote, true);
  for (const row of search({ mode: "in_person" }).items) assert.equal(row.inPerson, true);
});

test("jurisdiction is matched on its own axis, never derived from country", () => {
  // A jurisdiction filter must not behave like a country filter: selecting a
  // jurisdiction may legitimately return professionals based elsewhere.
  const results = search({ jurisdictions: ["US-FED"] });
  for (const row of results.items) {
    assert.ok(
      row.jurisdictionCodes.includes("US-FED"),
      `${row.displayName} was returned without claiming US-FED`,
    );
  }
});

test("sorting orders by name in both directions", () => {
  const asc = search({ sort: "name-asc" }).items.map((row) => row.displayName);
  const desc = search({ sort: "name-desc" }).items.map((row) => row.displayName);

  assert.deepEqual(asc, [...asc].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(desc, [...desc].sort((a, b) => b.localeCompare(a)));
  assert.notDeepEqual(asc, desc);
});

test("pages do not overlap and cover the whole set", () => {
  const seen: string[] = [];
  const { pageCount } = search();

  for (let page = 1; page <= pageCount; page += 1) {
    seen.push(...search({ page }).items.map((row) => row.slug));
  }

  assert.equal(seen.length, directoryFixtures.length);
  assert.equal(new Set(seen).size, seen.length, "a row appeared on two pages");
});

test("an out-of-range page clamps to the last page instead of 404ing", () => {
  const { pageCount } = search();
  const far = search({ page: 9999 });

  assert.equal(far.page, pageCount);
  assert.ok(far.items.length > 0, "a stale deep link must still show results");
});

test("city options come from the data and narrow to the selected country", () => {
  const all = availableCities(directoryFixtures, []);
  const us = availableCities(directoryFixtures, ["US"]);

  assert.ok(all.length > 0);
  assert.ok(us.length <= all.length);
  for (const option of us) assert.equal(option.countryCode, "US");

  // Every offered city token is one the parser will accept back.
  const tokens = allCityTokens(directoryFixtures);
  for (const option of all) assert.ok(tokens.has(option.value));
});
