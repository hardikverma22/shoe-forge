// Dev tool: prints each material's average base color (sRGB hex) in an imported model, so
// product configs can use the true starting color for whole-material parts.
// Usage: node scripts/material-means.mjs public/models/<id>.glb
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const hex = (v) => Math.round(Math.min(255, v)).toString(16).padStart(2, "0");
for (const m of doc.getRoot().listMaterials()) {
  const f = m.getBaseColorFactor();
  let rgb = [255, 255, 255];
  const t = m.getBaseColorTexture();
  if (t) {
    const { data, info } = await sharp(Buffer.from(t.getImage())).resize(64, 64).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const s = [0, 0, 0];
    let n = 0;
    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      if (r + g + b < 12) continue; // skip empty atlas background
      s[0] += r; s[1] += g; s[2] += b; n++;
    }
    rgb = s.map((x) => x / Math.max(1, n));
  }
  // Base color factor is linear; approximate with gamma 2.2 for display.
  const out = rgb.map((c, i) => c * Math.pow(f[i], 1 / 2.2));
  console.log(m.getName().padEnd(16), `#${out.map(hex).join("")}`.toUpperCase(), t ? "(texture)" : "(color)");
}
