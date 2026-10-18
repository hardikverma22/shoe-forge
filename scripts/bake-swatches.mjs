// Bakes a lit, grayscale swatch for each material from its normal and roughness maps:
//   public/textures/<material>/swatch.webp
// The page multiplies it over a color, so a swatch reads as the real surface in any color.
// Usage: node scripts/bake-swatches.mjs
import sharp from "sharp";

const MATERIALS = ["leather", "suede", "knit", "mesh", "canvas", "rubber"];
const SIZE = 768;
// Light from the upper left, slightly toward the viewer.
const L = normalize([-0.55, 0.6, 0.58]);
const H = normalize([L[0], L[1], L[2] + 1]);

function normalize(v) {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

for (const id of MATERIALS) {
  const dir = `public/textures/${id}`;
  const normal = await sharp(`${dir}/normal.webp`).resize(SIZE, SIZE).removeAlpha().raw().toBuffer();
  const rough = await sharp(`${dir}/roughness.webp`).resize(SIZE, SIZE).greyscale().raw().toBuffer();
  const out = Buffer.alloc(SIZE * SIZE);
  const vals = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const nx = (normal[i * 3] / 255) * 2 - 1;
    const ny = (normal[i * 3 + 1] / 255) * 2 - 1;
    const nz = (normal[i * 3 + 2] / 255) * 2 - 1;
    const len = Math.hypot(nx, ny, nz) || 1;
    const ndl = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / len);
    const ndh = Math.max(0, (nx * H[0] + ny * H[1] + nz * H[2]) / len);
    const r = rough[i] / 255;
    const shininess = 4 + (1 - r) * 120;
    const spec = Math.pow(ndh, shininess) * (1 - r) * 0.9;
    const v = 0.18 + ndl * 0.82 + spec;
    vals[i] = v;
  }
  // Auto-levels on the 2nd-98th percentile, with a capped gain so near-flat maps (patent) stay clean.
  const sorted = Float32Array.from(vals).sort();
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  const mid = (lo + hi) / 2;
  const gain = Math.min(3.2, 0.62 / Math.max(1e-3, hi - lo));
  for (let i = 0; i < vals.length; i++) {
    const v = 0.66 + (vals[i] - mid) * gain;
    out[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .webp({ quality: 82 })
    .toFile(`${dir}/swatch.webp`);
  console.log(`${id}: ${dir}/swatch.webp`);
}

// patent/swatch.webp is not baked here: patent has almost no relief, so its swatch is a
// greyscale capture of the real patent PBR material (clearcoat, roughness 0.2) rendered in
// three.js with the studio's RoomEnvironment lighting, then overlaid on the color in CSS.
