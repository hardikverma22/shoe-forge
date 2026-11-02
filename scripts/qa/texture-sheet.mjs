// Dev helper: every base-color texture of a GLB on one labeled sheet, to judge how clean its parts are.
//   node scripts/qa/texture-sheet.mjs <file.glb> <out.jpg>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";
await MeshoptDecoder.ready;
const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(src);
const tiles = [];
for (const mat of doc.getRoot().listMaterials()) {
  const tex = mat.getBaseColorTexture();
  const label = `<svg width="320" height="22"><rect width="320" height="22" fill="black"/><text x="4" y="16" fill="yellow" font-size="14">${mat.getName().replace(/[<&>]/g, "")}</text></svg>`;
  let img;
  if (tex) img = await sharp(Buffer.from(tex.getImage())).resize(320, 320, { fit: "fill" }).removeAlpha().toBuffer();
  else {
    const [r, g, b] = mat.getBaseColorFactor().map((v) => Math.round(255 * Math.pow(v, 1 / 2.2)));
    img = await sharp({ create: { width: 320, height: 320, channels: 3, background: { r, g, b } } }).png().toBuffer();
  }
  tiles.push(await sharp(img).composite([{ input: Buffer.from(label), top: 0, left: 0 }]).png().toBuffer());
}
const cols = 5;
await sharp({ create: { width: 320 * cols, height: 320 * Math.ceil(tiles.length / cols), channels: 3, background: "#888" } })
  .composite(tiles.map((t, k) => ({ input: t, left: (k % cols) * 320, top: Math.floor(k / cols) * 320 })))
  .jpeg({ quality: 80 })
  .toFile(out);
