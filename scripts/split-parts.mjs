// Splits the source glTF into one named node per shoe part, so each part keeps its own
// material and can be found by name at runtime. Output: .tmp-model/parts.glb
// Usage: node scripts/split-parts.mjs
import { NodeIO } from "@gltf-transform/core";
import { mkdir } from "node:fs/promises";

// Original primitive order == original material order (laces, mesh, caps, inner, sole, stripes, band, patch)
const PART_NAMES = ["laces", "upper", "toecap", "lining", "sole", "stripes", "heel", "tongue"];

const io = new NodeIO();
const doc = await io.read("public/models/source/shoe.gltf");
const root = doc.getRoot();
const scene = root.listScenes()[0];

const [mesh] = root.listMeshes();
const prims = mesh.listPrimitives();
if (prims.length !== PART_NAMES.length) {
  throw new Error(`Expected ${PART_NAMES.length} primitives, found ${prims.length}`);
}

// Rebuild: one mesh + node per primitive, named by part.
const oldNodes = root.listNodes().filter((n) => n.getMesh() === mesh);
for (const n of oldNodes) n.setMesh(null);
prims.forEach((prim, i) => {
  const name = PART_NAMES[i];
  const m = doc.createMesh(name).addPrimitive(prim);
  const node = doc.createNode(name).setMesh(m);
  scene.addChild(node);
});
mesh.dispose();
for (const n of oldNodes) n.dispose();

// The app supplies its own PBR texture sets, so drop the source photo textures.
for (const mat of root.listMaterials()) {
  mat.setBaseColorTexture(null).setNormalTexture(null).setOcclusionTexture(null)
    .setMetallicRoughnessTexture(null).setEmissiveTexture(null);
}

await mkdir(".tmp-model", { recursive: true });
await io.write(".tmp-model/parts.glb", doc);
console.log("parts:", PART_NAMES.join(", "));
