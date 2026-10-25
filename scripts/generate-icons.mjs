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
 * `src/components/shared/brand-logo.tsx`.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const UNITS = 32; // artwork coordinate space
const RADIUS = 7; // rounded-rect corner radius
const STROKE = 3.2; // glyph stroke width
const POINTS = [
  [8.5, 17],
  [13.5, 22],
  [23.5, 10.5],
];
const TILE = [0x08, 0x79, 0xe9]; // --color-action #0879E9
const GLYPH = [0xff, 0xff, 0xff]; // white
const SAMPLES = 4; // supersampling factor per axis

const hex = ([r, g, b]) =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

// --- signed distance helpers (negative = inside) -------------------------

function sdRoundedRect(x, y) {
  // Centered box of half-extent 16 with corner radius RADIUS.
  const dx = Math.abs(x - UNITS / 2) - (UNITS / 2 - RADIUS);
  const dy = Math.abs(y - UNITS / 2) - (UNITS / 2 - RADIUS);
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ox, oy) - RADIUS;
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
      const tile = coverage(x, y, size, sdRoundedRect);
      const glyph = coverage(x, y, size, sdGlyph);
      // Glyph is clipped to the tile, then composited over it.
      const inner = Math.min(glyph, tile);
      const offset = (y * size + x) * 4;

      for (let c = 0; c < 3; c += 1) {
        // Premultiplied-correct blend of glyph over tile, un-premultiplied
        // back out against the tile's own alpha.
        const mixed = tile > 0 ? (TILE[c] * (tile - inner) + GLYPH[c] * inner) / tile : 0;
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
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${UNITS} ${UNITS}" width="${UNITS}" height="${UNITS}" role="img" aria-label="TaxAccountant">\n` +
    `  <rect width="${UNITS}" height="${UNITS}" rx="${RADIUS}" fill="${hex(TILE)}"/>\n` +
    `  <path d="M${POINTS.map(([x, y]) => `${x} ${y}`).join(" ")}" fill="none" stroke="${hex(GLYPH)}"` +
    ` stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>\n` +
    `</svg>\n`,
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
