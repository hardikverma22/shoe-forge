// Dev helper: tiles images into one sheet.
//   node scripts/qa/montage.mjs <out.jpg> <columns> <tileWidth> <image ...>
import sharp from "sharp";
const [out, cols, tw, ...files] = process.argv.slice(2);
const w = +tw, c = +cols;
const tiles = await Promise.all(files.map((f) => sharp(f).resize(w).toBuffer({ resolveWithObject: true })));
const th = Math.max(...tiles.map((t) => t.info.height));
await sharp({ create: { width: w * c, height: th * Math.ceil(tiles.length / c), channels: 3, background: "#fff" } })
  .composite(tiles.map((t, k) => ({ input: t.data, left: (k % c) * w, top: Math.floor(k / c) * th })))
  .jpeg({ quality: 82 })
  .toFile(out);
