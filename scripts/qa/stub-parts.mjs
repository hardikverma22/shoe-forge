// Dev helper: a first draft of a tint shoe's parts, one per material, with its average color.
//   node scripts/qa/stub-parts.mjs public/models/<id>.glb
// Name, merge and order the parts by hand after checking them with region-map.mjs.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const toHex = (lin) => "#" + lin.map((v) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055))).map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("").toUpperCase();
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
for (const mat of doc.getRoot().listMaterials()) {
  const f = mat.getBaseColorFactor();
  let avg = [1, 1, 1];
  const tex = mat.getBaseColorTexture();
  if (tex) {
    const { data } = await sharp(Buffer.from(tex.getImage())).resize(64, 64).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    // Pure black is the unused space of the atlas (as in TintModel's averageColor).
    const s = [0, 0, 0];
    let n = 0;
    for (let i = 0; i < data.length; i += 3) {
      if (Math.max(data[i], data[i + 1], data[i + 2]) < 3) continue;
      n++;
      for (let c = 0; c < 3; c++) s[c] += lin(data[i + c] / 255);
    }
    avg = n ? s.map((v) => v / n) : [0, 0, 0];
  }
  const hex = toHex([0, 1, 2].map((c) => avg[c] * f[c]));
  const id = mat.getName().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  console.log(`    { id: "${id}", label: "${mat.getName()}", source: { material: "${mat.getName()}" }, allowedMaterials: ["leather"], default: { material: "leather", color: "${hex}" }, description: "" },`);
}
