// Dev helper: a texture (or region preview) with a labeled 5% grid, to read UV boxes off by eye.
//   node scripts/qa/grid.mjs <image> <out.png>
import sharp from "sharp";
const [src, out] = process.argv.slice(2);
let svg = '<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">';
for (let i = 0; i <= 20; i++) {
  const p = i * 50, c = i % 2 ? "#0f0" : "#f00";
  svg += `<line x1="${p}" y1="0" x2="${p}" y2="1000" stroke="${c}"/><line y1="${p}" x1="0" y2="${p}" x2="1000" stroke="${c}"/>`;
  if (i % 2 === 0) svg += `<text x="${p + 2}" y="12" fill="#ff0" font-size="13">${i * 5}</text><text x="2" y="${p + 12}" fill="#ff0" font-size="13">${i * 5}</text>`;
}
svg += "</svg>";
await sharp(src).resize(1000, 1000).removeAlpha().composite([{ input: Buffer.from(svg) }]).png().toFile(out);
