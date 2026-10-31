/**
 * Rasterizes the TaxAccountant brand mark into the PNG/ICO favicon fallbacks.
 *
 *   node scripts/generate-icons.mjs
 *
 * `public/favicon.svg` covers every browser that accepts an SVG favicon.
 * This script exists for the ones that do not: `favicon.ico` for legacy
 * Windows browsers and `apple-touch-icon.png`, which Safari requires as a
 * raster for iOS home-screen bookmarks.
 *
 * Node built-ins only (`zlib` for PNG deflate) — AGENTS.md section 3: never
 * add a dependency where a standard API will do. There is deliberately no
 * headless browser, no `sharp` and no `resvg` here; those also fail in
 * vinext's RSC dev environment (see the vinext README's known gaps).
 *
 * The geometry below must stay identical to `public/favicon.svg` and
 * `src/components/shared/brand-logo.tsx`. `favicon.svg` is emitted by this
 * script from the same constants, so the vector and the rasters cannot
 * drift; `brand-logo.tsx` carries the same path by hand.
 *
 * ## The mark, and why the small sizes are simplified
 * The brand mark (`public/logo.png`) is a navy shield holding a document
 * with four gold bullet squares, four navy text bars and a gold check.
 * That detail is right at poster size and illegible below about 64px: at
 * 16px the bars and bullets collapse into three grey smudges and the
 * silhouette stops reading as anything.
 *
 * So the icon sizes carry the mark reduced to what survives — the shield
 * silhouette and the gold check, in the same two brand colours. This is
 * the usual responsive-logo practice, not a different logo: same
 * proportions, measured off the master artwork (apex at 0.073 of height,
 * shoulders at 0.30, point at 0.919, widest span 0.152..0.848).
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UNITS = 32; // artwork coordinate space

/*
 * Shield outline, clockwise from the top apex, as cubic beziers. Measured
 * off `public/logo.png` and mirrored about x = 16 so the two halves are
 * exact rather than eyeballed.
 */
const SHIELD = [
  { to: [16, 2.4] },
  // The top edge carries an inflection — it leaves the apex steeply, then
  // flares hard to the shoulder — so it takes two curves. One cubic can
  // hold the sharp apex or the fast flare, not both: fitted as a single
  // curve the mark came out 0.08 of its width too broad at y = 0.14.
  //
  // The two meet at [11.94, 4.48] with G1 continuity: the second curve's
  // first handle is the reflection of the first curve's second handle
  // about that point, so the tangent carries through. Without it the join
  // shows as a visible crease in the shoulder at 512px.
  { c1: [15.3, 2.6], c2: [13.6, 3.3], to: [11.94, 4.48] },
  { c1: [10.28, 5.66], c2: [5.4, 6.6], to: [4.83, 8] },
  { to: [4.83, 16.6] },
  { c1: [4.83, 22], c2: [9.4, 26.6], to: [16, 29.4] },
  { c1: [22.6, 26.6], c2: [27.17, 22], to: [27.17, 16.6] },
  { to: [27.17, 8] },
  { c1: [26.6, 6.6], c2: [21.72, 5.66], to: [20.06, 4.48] },
  { c1: [18.4, 3.3], c2: [16.7, 2.6], to: [16, 2.4] },
];

const STROKE = 3; // check stroke width
const POINTS = [
  [10.6, 16],
  [14.2, 19.8],
  [21.6, 10.6],
];

const SHIELD_FILL = [0x10, 0x2c, 0x57]; // --color-navy #102C57
// The master artwork measures #082E5B, which is 1.02:1 from the token —
// the same navy to any eye. The token wins so the mark and the UI cannot
// drift apart over time.
const GLYPH = [0xcb, 0x9f, 0x36]; // brand gold #CB9F36, sampled from the master
// Gold on this navy is 5.63:1. On white it is 2.46:1, which is why gold is
// a mark and graphic colour only and never carries text — see the note on
// --color-gold in globals.css.

const SAMPLES = 4; // supersampling factor per axis

const hex = ([r, g, b]) =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

// --- signed distance helpers (negative = inside) -------------------------

/*
 * The shield, flattened once into a polygon and then measured with the
 * standard point-in-polygon signed distance. Sampling the beziers once at
 * module load beats evaluating them per sample: a 512px icon at 4x4
 * supersampling asks for 4.2 million distance queries.
 *
 * 24 segments per curve puts the flattening error near 0.002 units — about
 * a thirtieth of a pixel on the 512 raster, so the curve is smooth at every
 * size this emits.
 */
function cubicAt(p0, c1, c2, p3, t) {
  const u = 1 - t;
  return [0, 1].map(
    (i) =>
      u * u * u * p0[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p3[i],
  );
}

const SHIELD_POLY = (() => {
  const points = [];
  let cursor = SHIELD[0].to;
  points.push(cursor);

  for (const seg of SHIELD.slice(1)) {
    if (!seg.c1) {
      points.push(seg.to);
    } else {
      for (let i = 1; i <= 24; i += 1) {
        points.push(cubicAt(cursor, seg.c1, seg.c2, seg.to, i / 24));
      }
    }
    cursor = seg.to;
  }

  // The path closes on its own start point; drop the duplicate so the
  // winding test does not see a zero-length edge.
  return points.slice(0, -1);
})();

/** Negative inside. Winding sign, after Inigo Quilez's polygon SDF. */
function sdShield(x, y) {
  const v = SHIELD_POLY;
  const n = v.length;
  let d = (x - v[0][0]) ** 2 + (y - v[0][1]) ** 2;
  let sign = 1;

  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const ex = v[j][0] - v[i][0];
    const ey = v[j][1] - v[i][1];
    const wx = x - v[i][0];
    const wy = y - v[i][1];
    const h = Math.min(1, Math.max(0, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const bx = wx - ex * h;
    const by = wy - ey * h;
    d = Math.min(d, bx * bx + by * by);

    // Three half-plane tests; an odd number of crossings means inside.
    const c1 = y >= v[i][1];
    const c2 = y < v[j][1];
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) sign = -sign;
  }

  return sign * Math.sqrt(d);
}

function sdSegment(x, y, [ax, ay], [bx, by]) {
  const pax = x - ax;
  const pay = y - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}

/** Round caps and joins come free from unioning capsule distances. */
function sdGlyph(x, y) {
  let best = Infinity;
  for (let i = 0; i < POINTS.length - 1; i += 1) {
    best = Math.min(best, sdSegment(x, y, POINTS[i], POINTS[i + 1]));
  }
  return best - STROKE / 2;
}

/** Coverage in 0..1 for one pixel, by supersampling the SDF. */
function coverage(px, py, scale, sd) {
  let hits = 0;
  for (let sy = 0; sy < SAMPLES; sy += 1) {
    for (let sx = 0; sx < SAMPLES; sx += 1) {
      const x = ((px + (sx + 0.5) / SAMPLES) / scale) * UNITS;
      const y = ((py + (sy + 0.5) / SAMPLES) / scale) * UNITS;
      if (sd(x, y) <= 0) hits += 1;
    }
  }
  return hits / (SAMPLES * SAMPLES);
}

// --- RGBA raster ---------------------------------------------------------

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const tile = coverage(x, y, size, sdShield);
      const glyph = coverage(x, y, size, sdGlyph);
      // Glyph is clipped to the tile, then composited over it.
      const inner = Math.min(glyph, tile);
      const offset = (y * size + x) * 4;

      for (let c = 0; c < 3; c += 1) {
        // Premultiplied-correct blend of glyph over tile, un-premultiplied
        // back out against the tile's own alpha.
        const mixed = tile > 0 ? (SHIELD_FILL[c] * (tile - inner) + GLYPH[c] * inner) / tile : 0;
        rgba[offset + c] = Math.round(mixed);
      }
      rgba[offset + 3] = Math.round(tile * 255);
    }
  }

  return rgba;
}

// --- PNG encoding --------------------------------------------------------

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  // One filter byte (0 = None) per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const to = y * (size * 4 + 1);
    raw[to] = 0;
    rgba.copy(raw, to + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO container holding PNG-compressed entries (supported since IE11). */
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, png } of entries) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // 0 means 256
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // palette count
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dir.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...dir, ...entries.map((entry) => entry.png)]);
}

// --- emit ----------------------------------------------------------------

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const png = (size) => encodePng(size, render(size));

/** Emitted from the same constants as the rasters so the two cannot drift. */
/** The same beziers the raster uses, written out as an SVG path. */
const SHIELD_PATH = SHIELD.map((seg, index) => {
  const [x, y] = seg.to;
  if (index === 0) return `M${x} ${y}`;
  if (!seg.c1) return `L${x} ${y}`;
  return `C${seg.c1[0]} ${seg.c1[1]} ${seg.c2[0]} ${seg.c2[1]} ${x} ${y}`;
}).join(" ") + "Z";

/** Emitted from the same constants as the rasters so the two cannot drift. */
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${UNITS} ${UNITS}" width="${UNITS}" height="${UNITS}" role="img" aria-label="TaxAccountant">
` +
    `  <path d="${SHIELD_PATH}" fill="${hex(SHIELD_FILL)}"/>
` +
    `  <path d="M${POINTS.map(([x, y]) => `${x} ${y}`).join(" ")}" fill="none" stroke="${hex(GLYPH)}"` +
    ` stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>
` +
    `</svg>
`,
  "utf8",
);

const outputs = [
  ["favicon.svg", svg],
  ["favicon-32.png", png(32)],
  ["apple-touch-icon.png", png(180)],
  ["icon-192.png", png(192)],
  ["icon-512.png", png(512)],
  ["favicon.ico", encodeIco([16, 32, 48].map((size) => ({ size, png: png(size) })))],
];

for (const [name, buffer] of outputs) {
  writeFileSync(join(publicDir, name), buffer);
  console.log(`${name.padEnd(22)} ${String(buffer.length).padStart(7)} bytes`);
}
