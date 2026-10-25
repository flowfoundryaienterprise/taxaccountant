# Day 3 — Professional Directory & Advanced Search

Status notes for Phase 1 / Day 3. Source of truth for scope and rules:
`documents/PRD.md`, `documents/DESIGN.md`, `documents/ARCHITECTURE.md`,
`documents/DATABASE.md`, `documents/API.md`, `documents/AGENTS.md`.

## 1. What shipped

The canonical directory route `/find-accountant` — which already existed as
a Day 2 placeholder and is kept, not replaced — is now a working directory:
search bar, desktop filter sidebar, mobile filter sheet, active-filter
chips, result count, sorting, pagination, and loading/empty/error states.

Filter state lives **entirely in the URL**. The page is a Server Component
that parses `searchParams`, filters, sorts and paginates on the server; the
client components exist only to write back to the URL. No state-management
library was added. This is what makes shareable links, refresh and browser
back/forward correct by construction rather than by synchronisation code.

### URL contract

| Param | Values | Notes |
|---|---|---|
| `q` | free text, max 80 chars | AND of whitespace-separated terms |
| `country` | ISO 3166-1 alpha-2, comma-separated | professional's location |
| `city` | city token (`new-york`), comma-separated | validated against data |
| `jurisdiction` | jurisdiction code, comma-separated | **independent of `country`** |
| `service` | service slug, comma-separated | same slugs as the homepage |
| `language` | BCP-47 code, comma-separated | |
| `mode` | `remote` \| `in_person` | `either` is the default and is omitted |
| `sort` | `name-asc` \| `name-desc` \| `recent` | `name-asc` default, omitted |
| `page` | positive integer | `1` default, omitted; clamped to last page |

Unknown or malformed values are dropped rather than raising, so a stale or
hand-edited URL degrades to a valid search. Defaults are never serialised,
so "Clear all" returns to a bare `/find-accountant`. Repeated params
(`?country=US&country=CA`) are accepted as well as the comma form this app
emits.

## 2. Data source: fixtures, not the database

**The results are typed development-only fixtures**
(`src/lib/directory/fixtures.ts`), not a Convex query.

`convex/` contains only `schema.ts` and `healthCheck.ts`. The public search
function `professionals:search` (API.md section 2) is scheduled for
IMPLEMENTATION_PLAN.md **Day 9**, and the Day 3 brief explicitly forbids
creating backend search, permission systems or server-side workflows in this
task. So the frontend was built and tested against a fixture array shaped
exactly like the eventual query projection.

### Integrity rules applied

- `DirectoryProfessional` **has no rating, review-count, price or
  availability field at all**, so no component can render a fabricated one.
  Price/rating/availability filters and sorts are therefore not offered, and
  the filter panel says why (API.md section 2: "Filters for ratings,
  availability and price return no false data").
- Designations are self-declared and carry `status: "unverified"`. Nothing
  displays a verified badge or check mark. The professional-designation
  filter is **built but disabled**, with an explanation — offering it would
  imply the platform had reviewed those designations.
- Tax jurisdictions are assigned independently of `countryCode`. Several
  fixtures are authorized outside their country of residence (a
  Toronto-based professional on `US-FED`, a Berlin-based professional on
  `US-FED`, a Singapore-based professional on `GB-HMRC`), which is what lets
  the country/jurisdiction separation be tested rather than merely asserted.
- City options are derived from the data, never from an invented list.
- Only the four demo identities the Day 2 homepage already shows carry a
  photograph, reusing the same rights-cleared Pexels portraits. The other
  twelve render the initials avatar rather than reusing one person's face
  under a second name.
- A page-level notice states the count, that these are development examples,
  that designations are unverified, and that profile pages are not
  published. "View Profile" is a disabled control, because
  `/professionals/[slug]` is Day 10 — it does not link somewhere that cannot
  answer.
- `robots: { index: false, follow: true }` on the route: the brief forbids
  SEO-indexable fake professional listings. **Flip this to `index: true`
  when the route serves approved published profiles.**

### Swapping in Convex

Contained to the page shell. `src/lib/directory/filters.ts` is pure and
framework-free; `DirectoryResults` is the shape every component consumes.
Replace

```ts
const results = searchDirectory(directoryFixtures, filters);
```

with the `professionals:search` cursor-paginated result mapped into
`DirectoryResults`, and remove the `fixtures` import. Note that the current
implementation is offset-paginated (`page`) while API.md section 1 specifies
**bounded cursor** pagination — see the open question in section 4.

## 3. Convex schema review

Reviewed `convex/schema.ts` against the directory's needs. **No schema
changes were made** — the brief requires a documented requirement and
compatibility review first.

### Verdict: the Phase 1 model already supports this directory

| Need | Covered by |
|---|---|
| Countries | `countries` (`code`, `name`, `discoverable`, `status`) |
| Tax jurisdictions | `taxJurisdictions` (`code`, `countryId`, `level`, `parentId`) |
| Services | `serviceCategories` (`slug`, `publicationStatus`) |
| Professionals | `professionals` (`slug`, `displayName`, `kind`, `firmName`) |
| Professional locations | `professionalLocations` (`countryId`, `city`, `region`) |
| Professional services | `professionalServices` (`serviceId`, `taxJurisdictionId`, `enabled`, `remote`) |
| Professional languages | `professionalLanguages` + `languages` |
| Publication status | `professionals.publicationStatus` + `approvedProfile` |
| Credential verification | `professionalPublicCredentials.publicDisplayStatus` |

The separation the directory UI depends on is already modelled correctly:
authorization lives in `professionalServices.taxJurisdictionId` and is never
derivable from `professionalLocations.countryId`.

### Observations for the Day 9 query author

These are **observations, not applied changes.**

1. **Consultation mode is modelled twice.** `professionals.remoteServices`
   (profile-level) and `professionalServices.remote` (per service +
   jurisdiction). The UI currently filters on one "offers remote" boolean.
   Day 9 needs a documented rule for which one the public filter means, and
   `in person` is only expressible as "not remote" — there is no explicit
   `inPerson` field. If in-person availability is a real, separate claim
   rather than the negation of remote, it needs a field.

2. **No index supports filtering professionals by country or city.**
   `professionalLocations` has `by_country_city`, so the query must start
   from locations and resolve professionals, or start from
   `professionalServices.by_service_jurisdiction` — but neither path is
   indexed for *combining* country + jurisdiction + service + language in
   one pass. DATABASE.md already anticipates this: "An optional derived
   search document/index may be added after the search spike, with a
   reconciliation process from these source collections." That spike
   (IMPLEMENTATION_PLAN.md Day 3 BE task) is the right place to decide
   between multi-pass intersection and a derived search document.

3. **No index on `professionalLanguages` by language + professional**, only
   `by_language` and `by_professional`. Language-filtering a candidate set
   therefore needs a per-professional lookup or a derived document.

4. **Keyword search has no backing index.** `professionals` has no search
   index, so `q` cannot be served by the current schema at all. API.md
   already flags that "typos/synonyms/facets require a search-acceptance
   spike and potentially dedicated search provider". The fixture
   implementation does naive substring matching, which is explicitly *not* a
   model for the production query.

5. **Sorting.** `name-asc`/`name-desc` need an index on `displayName` to
   avoid loading and sorting in memory; "recently added" can use
   `_creationTime` but there is currently no compound index pairing it with
   `publicationStatus`. The fixture uses an explicit `fixtureOrder` integer
   standing in for `_creationTime`, deliberately **not** a fabricated date,
   so no date is rendered anywhere.

6. **City is a free-text string** on `professionalLocations.city`. The URL
   needs a stable token, so the UI slugifies it (`New York` →
   `new-york`). Two curators entering "NYC" and "New York" would produce two
   filter entries. A canonical city reference (or at least a normalised
   `citySlug` field) is worth considering before curation volume grows.

## 4. Open questions / not done

- **Pagination contract mismatch.** The UI uses offset pagination
  (`?page=N`) because the fixture array supports it and the brief requires a
  current page with Previous/Next and correct URL state. API.md specifies
  bounded **cursor** pagination for the real query. These do not compose:
  cursors cannot express "jump to page 7". Day 9 has to choose — a
  cursor-based Previous/Next without numbered pages, or an approved
  offset/total-count contract. Flagging rather than silently assuming.
- **Reveal-on-scroll and no-JS.** The results grid reuses the Day 2
  `Reveal` component for visual consistency. It starts at `opacity-0` and is
  revealed by `IntersectionObserver`, so results are not visible with
  JavaScript disabled. This matches the existing homepage pattern and the
  route is `noindex` for now, but it should be reconsidered before the
  directory becomes indexable.
- **Credential filtering**, price/rating/availability filters, and
  professional profile pages are intentionally absent — see section 2.
- Not implemented (out of Day 3 scope): dashboards, Better Auth,
  registration, bookings, payments, messaging, backend search, AI matching.
