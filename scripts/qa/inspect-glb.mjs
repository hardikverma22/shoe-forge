// Dev helper: lists the meshes, materials and textures of a GLB, to plan a shoe's parts.
//   node scripts/qa/inspect-glb.mjs <file.glb> [...]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const root = doc.getRoot();
  console.log("=====", f, "textures", root.listTextures().length);
  for (const n of root.listNodes()) {
    const m = n.getMesh(); if (!m) continue;
    const wm = n.getWorldMatrix();
    for (const p of m.listPrimitives()) {
      const mat = p.getMaterial(); const pos = p.getAttribute("POSITION");
      const tex = mat?.getBaseColorTexture();
      const img = tex ? `${tex.getMimeType()} ${tex.getSize()?.join("x")}` : "-";
      const c = mat?.getBaseColorFactor().map((v) => v.toFixed(2)).join(",");
      console.log(`  node=${n.getName()} mesh=${m.getName()} mat=${mat?.getName()} verts=${pos?.getCount()} color=${c} tex=${img} min=${pos?.getMin([]).map(v=>v.toFixed(1))} max=${pos?.getMax([]).map(v=>v.toFixed(1))} ws=${wm[0].toFixed(2)}`);
    }
  }
}
