// Builds the web-ready shoe models and their color-region masks.
//
//   node scripts/import-shoes.mjs [id ...]
//
// For each shoe in scripts/shoes.mjs:
//   1. downloads the GLB from Sketchfab into assets/sketchfab/<id>/ (needs SKETCHFAB_TOKEN in
//      .env.local; skipped when the file is already there),
//   2. keeps only the meshes listed in `keep`, and keeps UVs (the masks need them),
//   3. optimizes it (meshopt geometry, 1024px WebP textures) into public/models/<id>.glb,
//   4. writes region masks for textured materials into public/models/<id>/<material>/.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { compactPrimitive, metalRough, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { SHOES } from "./shoes.mjs";

const token = (existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "").match(/^SKETCHFAB_TOKEN=(.+)$/m)?.[1]?.trim();
const only = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const safe = (s) => s.replace(/[^a-z0-9_-]/gi, "_");

for (const shoe of SHOES.filter((s) => only.length === 0 || only.includes(s.id))) {
  const srcDir = `assets/sketchfab/${shoe.id}`;
  const src = `${srcDir}/model.glb`;
  if (!existsSync(src)) {
    if (!token) throw new Error(`Missing ${src} and no SKETCHFAB_TOKEN in .env.local`);
    await mkdir(srcDir, { recursive: true });
    const links = await (await fetch(`https://api.sketchfab.com/v3/models/${shoe.uid}/download`, { headers: { Authorization: `Token ${token}` } })).json();
    if (!links.glb?.url) throw new Error(`${shoe.id}: no GLB download (${JSON.stringify(links).slice(0, 120)})`);
    await writeFile(src, Buffer.from(await (await fetch(links.glb.url)).arrayBuffer()));
  }

  // Keep only the wanted meshes.
  const doc = await io.read(src);
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    // Match the mesh or its node: exporters name one or the other.
    if (mesh && !shoe.keep.test(mesh.getName()) && !shoe.keep.test(node.getName())) node.setMesh(null);
  }
  // Models that come as a pair: drop the triangles of the other shoe from meshes shared by both
  // (e.g. one laces mesh for the pair), by the world-space side of each triangle's center.
  if (shoe.clipX) {
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh();
      if (!mesh) continue;
      const m = node.getWorldMatrix();
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute("POSITION"), idx = prim.getIndices();
        if (!pos || !idx) continue;
        const keepTris = [];
        for (let t = 0; t + 2 < idx.getCount(); t += 3) {
          let cx = 0;
          for (let k = 0; k < 3; k++) {
            const p = pos.getElement(idx.getScalar(t + k), []);
            cx += m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
          }
          if (shoe.clipX(cx / 3)) keepTris.push(idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2));
        }
        idx.setArray(new Uint32Array(keepTris));
        // Drop the vertices nothing uses any more, or they still count in the bounds (an
        // invisible second shoe would shift the model's center).
        compactPrimitive(prim);
      }
    }
  }
  // Models with one material for everything: give each mesh its own (named) material, so the
  // upper, sole and laces become separate parts.
  for (const [meshName, matName] of Object.entries(shoe.materialPerMesh ?? {})) {
    const node = doc.getRoot().listNodes().find((n) => n.getMesh() && (n.getName() === meshName || n.getMesh().getName() === meshName));
    for (const prim of node?.getMesh()?.listPrimitives() ?? []) prim.setMaterial(prim.getMaterial().clone().setName(matName));
  }
  // Scans are often exported "unlit"; light them like everything else. Without a roughness map
  // glTF defaults to fully metallic, which turns fabric into dark chrome.
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === "KHR_materials_unlit") ext.dispose();
  for (const mat of doc.getRoot().listMaterials()) {
    if (!mat.getMetallicRoughnessTexture()) mat.setMetallicFactor(0).setRoughnessFactor(Math.max(0.75, mat.getRoughnessFactor()));
  }
  // Parts are materials: tag each with its name so the optimizer never merges two that look alike.
  for (const mat of doc.getRoot().listMaterials()) mat.setExtras({ ...mat.getExtras(), part: mat.getName() });
  // three.js no longer reads spec-gloss materials; convert them to metal-rough.
  await doc.transform(metalRough(), prune({ keepAttributes: true }));

  // Masks come from the full-resolution source textures.
  const regions = {};
  for (const mat of doc.getRoot().listMaterials()) {
    const cfg = shoe.masks[mat.getName()];
    if (!cfg) continue;
    let tex = mat.getBaseColorTexture();
    if (!tex) tex = mat.getExtension("KHR_materials_pbrSpecularGlossiness")?.getDiffuseTexture?.() ?? null;
    if (!tex) continue;
    const dir = `public/models/${shoe.id}/${safe(mat.getName())}`;
    await mkdir(dir, { recursive: true });
    const texPath = `${srcDir}/${safe(mat.getName())}.${tex.getMimeType().split("/")[1]}`;
    await writeFile(texPath, tex.getImage());
    const args = ["scripts/region-masks.mjs", texPath, dir, String(cfg.k)];
    if (cfg.merge) args.push("--merge", cfg.merge);
    for (const b of cfg.boxes ?? []) args.push("--box", b);
    if (cfg.lw) args.push("--lw", String(cfg.lw));
    if (cfg.minArea) args.push("--min-area", String(cfg.minArea));
    if (cfg.attr) {
      // Height map of this material in UV space, for height-limited boxes.
      const attrPath = `${srcDir}/${safe(mat.getName())}-attr.png`;
      execFileSync("node", ["scripts/uv-attributes.mjs", src, mat.getName(), attrPath], { stdio: "ignore" });
      args.push("--attr", attrPath);
    }
    const out = execFileSync("node", args, { encoding: "utf8" });
    regions[mat.getName()] = JSON.parse(out.trim().split("\n").pop());
    // The split preview is for checking by eye, not for the site: keep it with the sources.
    await rename(`${dir}/preview.png`, `${srcDir}/${safe(mat.getName())}-regions.png`);
  }

  const tmp = `${srcDir}/kept.glb`;
  await io.write(tmp, doc);
  execFileSync(
    "npx",
    ["gltf-transform", "optimize", tmp, `public/models/${shoe.id}.glb`, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024", "--join", "false", "--instance", "false", "--palette", "false", "--prune-attributes", "false", "--simplify", "false"],
    { stdio: "inherit" },
  );

  // A summary of what the product config has to reference.
  await mkdir(`public/models/${shoe.id}`, { recursive: true });
  const out = await io.read(`public/models/${shoe.id}.glb`);
  const meshes = out.getRoot().listNodes().filter((n) => n.getMesh()).map((n) => ({ node: n.getName(), mesh: n.getMesh().getName(), material: n.getMesh().listPrimitives()[0]?.getMaterial()?.getName() }));
  await writeFile(`public/models/${shoe.id}/manifest.json`, JSON.stringify({ meshes, regions }, null, 2));
  console.log(shoe.id, JSON.stringify({ meshes: meshes.length, regions: Object.fromEntries(Object.entries(regions).map(([k, v]) => [k, v.map((r) => r.mean)])) }));
}
