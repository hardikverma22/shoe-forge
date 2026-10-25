// Splits a shoe texture into color regions so each region can be recolored at runtime.
//
//   node scripts/region-masks.mjs <texture> <outDir> <k> [--merge 1+4,2+6] [--box x0,y0,x1,y1=3+5]
//                                 [--lw 0.5] [--min-area 0.0005] [--attr uv-attributes.png] [--size 1024]
//
// 1. k-means in Lab on a downsampled copy finds k color clusters.
//    --lw weights lightness against hue: below 1, shading and highlights on one panel stay in the
//    same cluster instead of splitting off by brightness.
// 2. Every pixel is assigned to its nearest cluster, then a majority filter and a minimum island
//    size (--min-area, a fraction of the texture) clean up scan noise.
// 3. Clusters can be merged (--merge) into the regions you actually want to customize, and a
//    texture area can be split out (--box, UV fractions with v down) when two parts share a
//    color, e.g. laces and logo that are both orange. Each --box adds one region at the end; it
//    can list several rects separated by ";" (one region spread over several atlas islands). With
//    --attr (from scripts/uv-attributes.mjs), an entry "h0-0.2" limits the box to texels at that
//    height on the shoe (0 = lowest, 1 = highest), e.g. a midsole that shares the upper's white.
//    "u0.3-1" limits it by normal.y (-1 facing down, 1 facing up), e.g. laces on top of the
//    foot vs stripes on the sides. Boxes ending in ":name" share one region with every other box
//    of that name. A name ending in "!" (e.g. ":logo!") marks fine detail such as printed
//    letters: those boxes are applied after the cleanup in step 2, which would erase thin strokes.
// Writes:
//   preview.png      each region painted in its mean color (to check the split)
//   mask-<n>.png     regions 3n..3n+2 as R, G, B weights (soft edges). RGB only: browsers
//                    premultiply alpha, which would wipe the other channels where alpha is 0.
//   regions.json     each region's mean color (sRGB hex) and pixel share
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const [input, outDir, kArg, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : fallback;
};
const K = Number(kArg ?? 6);
const SIZE = Number(opt("--size", 1024));
const LW = Number(opt("--lw", 1));
const ATTR = opt("--attr", null);
const MIN_AREA = Number(opt("--min-area", 0));
const boxes = rest
  .map((v, i) => (rest[i - 1] === "--box" ? v : null))
  .filter(Boolean)
  .map((v) => {
    const [rect, rhs] = v.split("=");
    const [list, label] = rhs.split(":");
    const parts = rect.split(";");
    return {
      rects: parts.filter((r) => !/^[hu]/.test(r)).map((r) => r.split(",").map(Number)),
      heights: parts.filter((r) => r.startsWith("h")).map((r) => r.slice(1).split("-").map(Number)),
      ups: parts.filter((r) => r.startsWith("u")).map((r) => r.slice(1).match(/^(-?[\d.]+)-(-?[\d.]+)$/).slice(1).map(Number)),
      clusters: list.split("+").map(Number),
      label: label ?? null,
      detail: label?.endsWith("!") ?? false,
    };
  });
// One region per box name (unnamed boxes get their own), in order of first appearance.
const boxRegion = [];
{
  const named = new Map();
  for (const b of boxes) {
    if (b.label && named.has(b.label)) boxRegion.push(named.get(b.label));
    else {
      const r = named.size + boxRegion.filter((x, i) => !boxes[i].label).length;
      boxRegion.push(r);
      if (b.label) named.set(b.label, r);
    }
  }
}
const BOX_REGIONS = new Set(boxRegion).size;
const merges = (opt("--merge", "") || "")
  .split(",")
  .filter(Boolean)
  .map((g) => g.split("+").map(Number));

// sRGB <-> Lab
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function toLab(r, g, b) {
  const R = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [(116 * y - 16) * LW, 500 * (x - y), 200 * (y - z)];
}

const { data, info } = await sharp(input).resize(SIZE, SIZE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const N = info.width * info.height;
const attr = ATTR ? (await sharp(ATTR).resize(SIZE, SIZE, { kernel: "nearest" }).removeAlpha().raw().toBuffer()) : null;
const lab = new Float32Array(N * 3);
for (let i = 0; i < N; i++) lab.set(toLab(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]), i * 3);

// k-means on a sample, seeded with k-means++ (deterministic RNG)
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const sample = [];
for (let i = 0; i < N; i += 7) sample.push(i);
const d2 = (i, c) => (lab[i * 3] - c[0]) ** 2 + (lab[i * 3 + 1] - c[1]) ** 2 + (lab[i * 3 + 2] - c[2]) ** 2;
const centers = [[...lab.slice(sample[0] * 3, sample[0] * 3 + 3)]];
while (centers.length < K) {
  const dist = sample.map((i) => Math.min(...centers.map((c) => d2(i, c))));
  let r = rand() * dist.reduce((a, b) => a + b, 0);
  let pick = sample[0];
  for (let j = 0; j < sample.length; j++) if ((r -= dist[j]) <= 0) { pick = sample[j]; break; }
  centers.push([...lab.slice(pick * 3, pick * 3 + 3)]);
}
for (let iter = 0; iter < 25; iter++) {
  const sum = centers.map(() => [0, 0, 0, 0]);
  for (const i of sample) {
    let best = 0, bd = Infinity;
    centers.forEach((c, j) => { const d = d2(i, c); if (d < bd) { bd = d; best = j; } });
    const s = sum[best]; s[0] += lab[i * 3]; s[1] += lab[i * 3 + 1]; s[2] += lab[i * 3 + 2]; s[3]++;
  }
  sum.forEach((s, j) => { if (s[3]) centers[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
}

// Assign every pixel, then apply merges so cluster ids become region ids.
const clusterToRegion = centers.map((_, j) => j);
for (const group of merges) for (const j of group.slice(1)) clusterToRegion[j] = group[0];
const used = [...new Set(clusterToRegion)].sort((a, b) => a - b);
const regionIndex = new Map(used.map((r, i) => [r, i]));
let ids = new Uint8Array(N);
const clusterOf = new Uint8Array(N);
function inBox(b, i) {
  const x = (i % info.width) / info.width, y = Math.floor(i / info.width) / info.height;
  // No rects means the whole texture (a height-only box).
  let inside = !b.rects.length || b.rects.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  if (inside && (b.heights.length || b.ups.length)) {
    if (!attr) throw new Error("A height or normal box needs --attr");
    const h = attr[i * 3] / 255;
    const up = (attr[i * 3 + 1] / 255) * 2 - 1;
    inside =
      attr[i * 3 + 2] > 0 &&
      (!b.heights.length || b.heights.some(([lo, hi]) => h >= lo && h <= hi)) &&
      (!b.ups.length || b.ups.some(([lo, hi]) => up >= lo && up <= hi));
  }
  return inside && b.clusters.includes(clusterOf[i]);
}
for (let i = 0; i < N; i++) {
  let best = 0, bd = Infinity;
  centers.forEach((c, j) => { const d = d2(i, c); if (d < bd) { bd = d; best = j; } });
  clusterOf[i] = best;
  ids[i] = regionIndex.get(clusterToRegion[best]);
  boxes.forEach((b, bi) => {
    if (!b.detail && inBox(b, i)) ids[i] = used.length + boxRegion[bi];
  });
}

// Majority filter (5x5) twice: removes speckle from photo scans.
const W = info.width, H = info.height, R = used.length + BOX_REGIONS;
for (let pass = 0; pass < 2; pass++) {
  const next = new Uint8Array(N);
  const counts = new Uint16Array(R);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    counts.fill(0);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const yy = Math.min(H - 1, Math.max(0, y + dy)), xx = Math.min(W - 1, Math.max(0, x + dx));
      counts[ids[yy * W + xx]]++;
    }
    let best = ids[y * W + x], bc = 0;
    for (let r = 0; r < R; r++) if (counts[r] > bc) { bc = counts[r]; best = r; }
    next[y * W + x] = best;
  }
  ids = next;
}

// Islands smaller than MIN_AREA join the region that surrounds them most.
if (MIN_AREA > 0) {
  const minPx = Math.round(MIN_AREA * N);
  const comp = new Int32Array(N).fill(-1);
  const stack = new Int32Array(N);
  for (let start = 0; start < N; start++) {
    if (comp[start] !== -1) continue;
    const r = ids[start];
    let top = 0, n = 0;
    const members = [];
    const border = new Uint32Array(R);
    stack[top++] = start;
    comp[start] = start;
    while (top) {
      const i = stack[--top];
      members.push(i);
      n++;
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0) continue;
        if (ids[j] !== r) { border[ids[j]]++; continue; }
        if (comp[j] === -1) { comp[j] = start; stack[top++] = j; }
      }
    }
    if (n < minPx) {
      let best = r, bc = 0;
      for (let q = 0; q < R; q++) if (q !== r && border[q] > bc) { bc = border[q]; best = q; }
      for (const i of members) ids[i] = best;
    }
  }
}

// Detail boxes go on last, pixel by pixel. Inside their rects the cleanup is undone too, so the
// gaps between letters keep their own color instead of the one the filter smeared over them.
const rawRegion = (i) => regionIndex.get(clusterToRegion[clusterOf[i]]);
for (const [bi, b] of boxes.entries()) {
  if (!b.detail) continue;
  for (let i = 0; i < N; i++) {
    const x = (i % W) / W, y = Math.floor(i / W) / H;
    if (!b.rects.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1)) continue;
    if (inBox(b, i)) ids[i] = used.length + boxRegion[bi];
    else if (ids[i] < used.length) ids[i] = rawRegion(i);
  }
}

// Region stats (mean sRGB color, share) from the original pixels.
const stats = Array.from({ length: R }, () => [0, 0, 0, 0]);
for (let i = 0; i < N; i++) { const s = stats[ids[i]]; s[0] += data[i * 3]; s[1] += data[i * 3 + 1]; s[2] += data[i * 3 + 2]; s[3]++; }
const hex = (v) => Math.round(v).toString(16).padStart(2, "0");
const regions = stats.map((s, r) => ({ region: r, mean: `#${hex(s[0] / s[3])}${hex(s[1] / s[3])}${hex(s[2] / s[3])}`.toUpperCase(), share: +(s[3] / N).toFixed(4) }));

await mkdir(outDir, { recursive: true });
const preview = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) { const s = stats[ids[i]]; preview[i * 3] = s[0] / s[3]; preview[i * 3 + 1] = s[1] / s[3]; preview[i * 3 + 2] = s[2] / s[3]; }
await sharp(preview, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${outDir}/preview.png`);

// Soft masks: one-hot weights blurred slightly so region edges blend.
for (let m = 0; m * 3 < R; m++) {
  const buf = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) { const c = ids[i] - m * 3; if (c >= 0 && c < 3) buf[i * 3 + c] = 255; }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).blur(1.2).png().toFile(`${outDir}/mask-${m}.png`);
}
await writeFile(`${outDir}/regions.json`, JSON.stringify(regions, null, 2));
console.log(JSON.stringify(regions));
