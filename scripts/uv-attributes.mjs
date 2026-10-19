// Bakes where each texel sits on the shoe, so color regions can be split by 3D position.
//
//   node scripts/uv-attributes.mjs <model.glb> <material> <out.png> [--size 1024]
//
// Rasterizes every triangle of the material's meshes into UV space (v down, like the texture):
//   R = height on the shoe, 0 at the lowest point of those meshes, 255 at the highest
//   G = normal.y, 0 facing straight down, 128 sideways, 255 straight up
//   B = 255 where any triangle covers the texel
// scripts/region-masks.mjs reads it with --attr and splits regions with --hbox.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

const [input, material, out, ...rest] = process.argv.slice(2);
const SIZE = Number(rest[rest.indexOf("--size") + 1] ?? 1024) || 1024;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(input);

const mul = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const mulDir = (m, d) => {
  const v = [m[0] * d[0] + m[4] * d[1] + m[8] * d[2], m[1] * d[0] + m[5] * d[1] + m[9] * d[2], m[2] * d[0] + m[6] * d[1] + m[10] * d[2]];
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};

// Collect triangles in world space.
const tris = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMaterial()?.getName() !== material) continue;
    const pos = prim.getAttribute("POSITION"), uv = prim.getAttribute("TEXCOORD_0"), nor = prim.getAttribute("NORMAL");
    if (!pos || !uv) continue;
    const idx = prim.getIndices();
    const count = idx ? idx.getCount() : pos.getCount();
    const get = (i) => (idx ? idx.getScalar(i) : i);
    for (let i = 0; i + 2 < count; i += 3) {
      tris.push([0, 1, 2].map((k) => {
        const vi = get(i + k);
        return { p: mul(m, pos.getElement(vi, [])), uv: uv.getElement(vi, []), n: nor ? mulDir(m, nor.getElement(vi, [])) : [0, 1, 0] };
      }));
    }
  }
}
if (!tris.length) throw new Error(`No triangles with material "${material}"`);
let minY = Infinity, maxY = -Infinity;
for (const t of tris) for (const v of t) { minY = Math.min(minY, v.p[1]); maxY = Math.max(maxY, v.p[1]); }

const buf = Buffer.alloc(SIZE * SIZE * 3);
for (const t of tris) {
  const P = t.map((v) => [(v.uv[0] - Math.floor(v.uv[0])) * SIZE, (v.uv[1] - Math.floor(v.uv[1])) * SIZE]);
  const x0 = Math.max(0, Math.floor(Math.min(P[0][0], P[1][0], P[2][0]))), x1 = Math.min(SIZE - 1, Math.ceil(Math.max(P[0][0], P[1][0], P[2][0])));
  const y0 = Math.max(0, Math.floor(Math.min(P[0][1], P[1][1], P[2][1]))), y1 = Math.min(SIZE - 1, Math.ceil(Math.max(P[0][1], P[1][1], P[2][1])));
  const d = (P[1][1] - P[2][1]) * (P[0][0] - P[2][0]) + (P[2][0] - P[1][0]) * (P[0][1] - P[2][1]);
  if (Math.abs(d) < 1e-9) continue;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5;
    const a = ((P[1][1] - P[2][1]) * (px - P[2][0]) + (P[2][0] - P[1][0]) * (py - P[2][1])) / d;
    const b = ((P[2][1] - P[0][1]) * (px - P[2][0]) + (P[0][0] - P[2][0]) * (py - P[2][1])) / d;
    const c = 1 - a - b;
    if (a < -0.02 || b < -0.02 || c < -0.02) continue;
    const h = (a * t[0].p[1] + b * t[1].p[1] + c * t[2].p[1] - minY) / (maxY - minY || 1);
    const ny = a * t[0].n[1] + b * t[1].n[1] + c * t[2].n[1];
    const o = (y * SIZE + x) * 3;
    buf[o] = Math.round(Math.min(1, Math.max(0, h)) * 255);
    buf[o + 1] = Math.round((Math.min(1, Math.max(-1, ny)) * 0.5 + 0.5) * 255);
    buf[o + 2] = 255;
  }
}
// Pad every island outward a few texels: texture filtering at island edges reads past them, and
// an unpainted texel there would fall out of every height box (a crack along the seam).
for (let pass = 0; pass < 4; pass++) {
  const src = Buffer.from(buf);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const o = (y * SIZE + x) * 3;
    if (src[o + 2]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;
      const q = (yy * SIZE + xx) * 3;
      if (!src[q + 2]) continue;
      buf[o] = src[q]; buf[o + 1] = src[q + 1]; buf[o + 2] = 254;
      break;
    }
  }
}
await sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 3 } }).png().toFile(out);
console.log(JSON.stringify({ triangles: tris.length, minY, maxY }));
