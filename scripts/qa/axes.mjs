// Dev helper: principal axes of a model's vertices, to find the yaw (and tilt) that lines the
// shoe's length up with an axis.  node scripts/qa/axes.mjs <model.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const pts = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    for (let i = 0; i < pos.getCount(); i += 5) {
      const p = pos.getElement(i, []);
      pts.push([0, 1, 2].map((k) => m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k]));
    }
  }
}
const c = [0, 1, 2].map((k) => pts.reduce((s, p) => s + p[k], 0) / pts.length);
const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
for (const p of pts) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (p[i] - c[i]) * (p[j] - c[j]);
// Power iteration for the main axis.
let v = [1, 0.1, 0.1];
for (let it = 0; it < 100; it++) {
  const w = [0, 1, 2].map((i) => C[i][0] * v[0] + C[i][1] * v[1] + C[i][2] * v[2]);
  const l = Math.hypot(...w);
  v = w.map((x) => x / l);
}
const deg = (r) => ((r * 180) / Math.PI).toFixed(1);
console.log("main axis", v.map((x) => x.toFixed(3)).join(","), "yaw from +x:", deg(Math.atan2(-v[2], v[0])), "tilt:", deg(Math.asin(v[1])));
