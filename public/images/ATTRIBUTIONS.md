# Image asset sources and licenses

All photographs were downloaded from Pexels (https://www.pexels.com) under the
[Pexels License](https://www.pexels.com/license/) — free for commercial and
non-commercial use, no attribution required. Attribution is listed below
anyway as good practice. Downloaded at build time via direct CDN URLs
(`images.pexels.com`), not hotlinked.

| File | Pexels photo | Photographer |
|---|---|---|
| `hero-accountant.jpg` | [photo/3855619](https://www.pexels.com/photo/smiling-businesswoman-with-laptop-in-office-3855619/) | Andrea Piacquadio |
| `professional-1.jpg` | [photo/3756679](https://www.pexels.com/photo/laughing-businesswoman-working-in-office-with-laptop-3756679/) | Andrea Piacquadio |
| `professional-2.jpg` | [photo/32064778](https://www.pexels.com/photo/professional-headshot-of-businessman-in-suit-32064778/) | Alpha Pixels |
| `professional-3.jpg` | [photo/7642127](https://www.pexels.com/photo/a-portrait-of-a-woman-in-business-attire-and-eyeglasses-7642127/) | cottonbro studio |
| `professional-4.jpg` | [photo/7841788](https://www.pexels.com/photo/a-portrait-of-a-businessman-7841788/) | cottonbro studio |
| `cta-professionals.jpg` | [photo/7643735](https://www.pexels.com/photo/man-in-glasses-holding-a-folder-while-talking-to-a-woman-in-suit-7643735/) | cottonbro studio |
| `article-tax-documents.jpg` | [photo/6863250](https://www.pexels.com/photo/tax-documents-on-the-table-6863250/) | Nataliya Vaitkevich |
| `article-small-business.jpg` | [photo/6694492](https://www.pexels.com/photo/an-accountant-s-workspace-6694492/) | Tima Miroshnichenko |
| `article-international-globe.jpg` | [photo/8828345](https://www.pexels.com/photo/hand-holding-a-tiny-red-flag-near-the-world-globe-8828345/) | Monstera Production |
| `article-accountant-calculator.jpg` | [photo/6963847](https://www.pexels.com/photo/a-person-sitting-a-wooden-table-with-a-notepad-and-laptop-using-a-calculator-6963847/) | Mikhail Nilov |
| `testimonial-1.jpg` | [photo/18809829](https://www.pexels.com/photo/portrait-of-a-woman-smiling-18809829/) | — |
| `testimonial-2.jpg` | [photo/30767572](https://www.pexels.com/photo/professional-portrait-of-a-smiling-man-30767572/) | — |
| `testimonial-3.jpg` | [photo/34381970](https://www.pexels.com/photo/professional-portrait-of-smiling-businesswoman-34381970/) | — |

`world-map.svg` is from Wikimedia Commons —
[World_location_map.svg](https://commons.wikimedia.org/wiki/File:World_location_map.svg),
by STyx, released into the public domain. Recolored (`.sea`/`.land` fill and
stroke in the embedded `<style>` block) to match this project's brand tokens
(`--color-tint` / a lighter tint of `--color-action`); a `viewBox` was added
so it scales responsively.

Day 9: the file was 594.6 KB, the largest asset on the site by some margin
and bigger than any JavaScript chunk — 98% of it was path data carried at
five decimal places by the Inkscape export it came from. Coordinates are now
rounded to two decimals and the editor's own metadata (`<metadata>`,
`sodipodi:namedview`, `inkscape:*`) is dropped, which takes it to 404.0 KB.

The `viewBox` is `0 0 800 400`, so two decimals is a hundredth of a user
unit — well under a thousandth of a pixel at the size this ever renders.
Verified rather than assumed: rasterizing the before and after at 1600x800
(twice the natural size) gives **zero** differing pixels out of 1,280,000.
Path geometry is therefore changed in the file but not in the output.

## Country flags

`images/flags/*.svg` are the Wikimedia Commons flag SVGs, all ten **public
domain** — verified per file through the Commons API (`extmetadata`
`LicenseShortName`) before download, not assumed from the fact that they are
flags. Rendered by `src/components/countries/country-badge.tsx`.

| File | Commons file | Ratio | Author credited on Commons |
|---|---|---|---|
| `us.svg` | [Flag of the United States.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_States.svg) | 10:19 | Dbenbenn, Zscout370, Jacobolus, Indolences, Technion |
| `ca.svg` | [Flag of Canada (Pantone).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Canada_(Pantone).svg) | 1:2 | Original design George F. G. Stanley |
| `gb.svg` | [Flag of the United Kingdom (1-2).svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_Kingdom_(1-2).svg) | 1:2 | Acts of Union 1800; vector Zscout370 |
| `de.svg` | [Flag of Germany.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Germany.svg) | 3:5 | SKopp, Madden and others |
| `in.svg` | [Flag of India.svg](https://commons.wikimedia.org/wiki/File:Flag_of_India.svg) | 2:3 | Government of India |
| `sg.svg` | [Flag of Singapore.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Singapore.svg) | 2:3 | Government of Singapore; vector Zscout370 |
| `au.svg` | [Flag of Australia (converted).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Australia_(converted).svg) | 1:2 | Vector by Ian Fieggen |
| `ae.svg` | [Flag of the United Arab Emirates.svg](https://commons.wikimedia.org/wiki/File:Flag_of_the_United_Arab_Emirates.svg) | 1:2 | Abdulla Mohammed Al Maainah |
| `fr.svg` | [Flag of France.svg](https://commons.wikimedia.org/wiki/File:Flag_of_France.svg) | 2:3 | Vector SKopp |
| `jp.svg` | [Flag of Japan.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Japan.svg) | 2:3 | Various |

The ten are exactly the countries in `src/lib/marketplace/countries.ts`,
including the two that are deliberately not discoverable (`FR`, `JP`) — the
badge is also used on professional profiles, which can cite a location in a
country the public directory does not list.

Each file is the Commons original with the XML prolog, any `DOCTYPE`,
comments and inter-tag whitespace stripped, and a `viewBox` added to `fr.svg`
and `jp.svg`, which carried only `width`/`height` and so would not scale.
No path data, colour or geometry was touched: the flags are the published
drawings, not redrawings. All ten together are 5.8 KB.

Not emoji: regional-indicator pairs render as bare letters on Windows, which
is why `country-badge.tsx` shipped an ISO-code tile until these files
existed. That tile is still the fallback for any country code without a file
here.

## Known gap

All `professional-*.jpg` and `testimonial-*.jpg` files are confirmed
genuinely different people (checked by visual inspection — two early picks
for the professional cards turned out to be the same photoshoot and were
swapped out). Used only as illustrative fixtures per `lib/home-content.ts`,
not as real listings or real reviews.

**Note on content accuracy:** the ratings, review counts, hourly rates,
"Available Today" badges, marketplace stats (10,000+ professionals, etc.)
and client testimonials in `lib/home-content.ts` are a literal, explicitly
requested replica of a supplied reference design — not data this project's
own `PRD.md`/`AGENTS.md` would otherwise allow fabricating. See the git
history / conversation log for that instruction before treating any of this
content as a real data source.

## Brand mark and favicons

`public/favicon.svg`, `public/favicon.ico`, `public/favicon-32.png`,
`public/apple-touch-icon.png`, `public/icon-192.png` and
`public/icon-512.png` are **original artwork for this project** — no
third-party asset, stock mark or licensed font is involved, so no
attribution is owed.

They are generated from a single geometry definition by
`scripts/generate-icons.mjs` (Node built-ins only). Regenerate with:

```
node scripts/generate-icons.mjs
```

The same shape is drawn inline by `src/components/shared/brand-logo.tsx`
for the header and footer; the two must be kept in sync by hand.
