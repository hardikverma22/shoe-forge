// Dev tool: writes each material's base color texture next to a model, for mapping regions.
// Usage: node scripts/extract-textures.mjs <dir containing model.glb>
// Writes each material's base color texture to <dir>/tex-<material>.png
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { writeFile } from "node:fs/promises";
const dir = process.argv[2];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(`${dir}/model.glb`);
for (const m of doc.getRoot().listMaterials()) {
  let t = m.getBaseColorTexture();
  if (!t) { const sg = m.getExtension("KHR_materials_pbrSpecularGlossiness"); t = sg?.getDiffuseTexture?.(); }
  if (t) await writeFile(`${dir}/tex-${m.getName().replace(/[^a-z0-9_-]/gi, "_")}.${t.getMimeType().split("/")[1]}`, t.getImage());
  console.log(dir.split("/").pop(), m.getName(), t ? t.getMimeType() : "(color " + m.getBaseColorFactor().map((x) => x.toFixed(2)).join(",") + ")");
}
