// Traces a shoe thumbnail's outline into an SVG path, for the home-page loader's "mold".
//
//   node scripts/trace-silhouette.mjs <image> [--where "r > g && g > b"] [--all]
//
// Walks the outline of the alpha mask (or of the pixels matching --where, an expression of r, g,
// b, a), simplifies it (Ramer-Douglas-Peucker), smooths it into cubic curves and prints
// { viewBox, d } as JSON. --all traces every blob bigger than 0.2% of the image, not just the largest.
import sharp from "sharp";

const [input, ...rest] = process.argv.slice(2);
const where = rest.includes("--where") ? new Function("r", "g", "b", "a", `return ${rest[rest.indexOf("--where") + 1]};`) : null;
const all = rest.includes("--all");
const W = 600;
const { data, info } = await sharp(input).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const H = info.height;
const solid = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const o = (y * W + x) * 4;
  return data[o + 3] > 140 && (!where || where(data[o], data[o + 1], data[o + 2], data[o + 3]));
};

// Keep the largest connected blob (stray lace tips and shadow specks would end the trace early).
const label = new Int32Array(W * H).fill(-1);
let bestLabel = -1, bestSize = 0;
const sizes = [];
for (let i = 0, n = 0; i < W * H; i++) {
  if (label[i] !== -1 || !solid(i % W, (i / W) | 0)) continue;
  const stack = [i];
  label[i] = n;
  let size = 0;
  while (stack.length) {
    const j = stack.pop();
    size++;
    const x = j % W, y = (j / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (y + dy) * W + x + dx;
      if (solid(x + dx, y + dy) && label[k] === -1) { label[k] = n; stack.push(k); }
    }
  }
  sizes.push(size);
  if (size > bestSize) { bestSize = size; bestLabel = n; }
  n++;
}
function trace(which) {
const inside = (x, y) => solid(x, y) && label[y * W + x] === which;

// Moore-neighbour tracing around the outline, starting from the first inside pixel.
const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
let start = null;
for (let y = 0; y < H && !start; y++) for (let x = 0; x < W; x++) if (inside(x, y)) { start = [x, y]; break; }
const best = [start];
let cur = start, from = 4; // entered from the left
for (let guard = 0; guard < W * H; guard++) {
  let found = null;
  for (let k = 0; k < 8; k++) {
    const dir = (from + 1 + k) % 8;
    const nx = cur[0] + dirs[dir][0], ny = cur[1] + dirs[dir][1];
    if (inside(nx, ny)) { found = [nx, ny, dir]; break; }
  }
  if (!found) break;
  cur = [found[0], found[1]];
  from = (found[2] + 4) % 8;
  if (cur[0] === start[0] && cur[1] === start[1]) break;
  best.push(cur);
}

return best;
}

// Ramer-Douglas-Peucker.
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
function simplify(best) {
// A closed loop has the same first and last point, so simplify its two halves separately.
let far = 0;
for (let i = 0; i < best.length; i++)
  if (Math.hypot(best[i][0] - best[0][0], best[i][1] - best[0][1]) > Math.hypot(best[far][0] - best[0][0], best[far][1] - best[0][1])) far = i;
return [...rdp(best.slice(0, far + 1), 1).slice(0, -1), ...rdp([...best.slice(far), best[0]], 1)];
}

// Catmull-Rom through the simplified points, as cubic Beziers.
function smooth(pts) {
  const p = pts.slice(0, -1);
  const n = p.length;
  const f = (v) => v.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

const labels = all ? sizes.map((sz, i) => (sz > W * H * 0.002 ? i : -1)).filter((i) => i >= 0) : [bestLabel];
const d = labels.map((l) => smooth(simplify(trace(l)))).join("");
console.log(JSON.stringify({ viewBox: `0 0 ${W} ${H}`, d }));
