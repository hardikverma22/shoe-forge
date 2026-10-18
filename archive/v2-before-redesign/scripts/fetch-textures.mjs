// Downloads CC0 PBR sets from ambientCG (1K JPG), converts them to 1024px WebP and writes:
//   public/textures/<material>/{color,normal,roughness,thumb}.webp
// Usage: node scripts/fetch-textures.mjs
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const run = promisify(execFile);

// material -> ambientCG asset id
const SETS = {
  leather: "Leather037",
  suede: "Fabric030",
  knit: "Fabric048",
  mesh: "Fabric045",
  canvas: "Fabric026",
  rubber: "Rubber004",
  patent: "Plastic010",
};

const TMP = path.resolve(".tmp-textures");
await mkdir(TMP, { recursive: true });

for (const [material, id] of Object.entries(SETS)) {
  const res = await fetch(`https://ambientcg.com/get?file=${id}_1K-JPG.zip`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const dir = path.join(TMP, id);
  await mkdir(dir, { recursive: true });
  const zip = path.join(TMP, `${id}.zip`);
  await writeFile(zip, Buffer.from(await res.arrayBuffer()));
  await run("unzip", ["-o", "-q", zip, "-d", dir]);

  const files = await readdir(dir);
  const pick = (suffix) => {
    const f = files.find((x) => x.endsWith(`_1K-JPG_${suffix}.jpg`));
    if (!f) throw new Error(`${id}: missing ${suffix}`);
    return path.join(dir, f);
  };

  const out = path.resolve("public/textures", material);
  await mkdir(out, { recursive: true });
  // normal: OpenGL convention (GL) is what three.js expects
  const maps = { color: pick("Color"), normal: pick("NormalGL"), roughness: pick("Roughness") };
  for (const [name, src] of Object.entries(maps)) {
    await sharp(src).resize(1024, 1024, { fit: "cover" }).webp({ quality: 82 }).toFile(path.join(out, `${name}.webp`));
  }
  // small square thumbnail used by the material and color pickers
  await sharp(maps.color).resize(128, 128, { fit: "cover" }).webp({ quality: 80 }).toFile(path.join(out, "thumb.webp"));
  console.log("ok", material, id);
}

await rm(TMP, { recursive: true, force: true });
