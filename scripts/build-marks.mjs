// Renders the graphic marks to white-on-transparent PNGs in public/marks/.
// Shapes come from Lucide (ISC license); filled marks are drawn solid, line marks with a heavy stroke.
// Usage: node scripts/build-marks.mjs
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import * as L from "lucide-react";

const FILLED = { star: L.Star, bolt: L.Zap, flame: L.Flame, heart: L.Heart, moon: L.Moon, crown: L.Crown, shield: L.Shield, leaf: L.Leaf, sparkles: L.Sparkles, cloud: L.Cloud, droplet: L.Droplet, hexagon: L.Hexagon };
const LINED = { snowflake: L.Snowflake, target: L.Target, infinity: L.Infinity, asterisk: L.Asterisk, mountain: L.Mountain, wind: L.Wind, music: L.Music2, globe: L.Globe };

async function render(name, Icon, filled) {
  const svg = renderToStaticMarkup(
    createElement(Icon, { size: 480, color: "#ffffff", strokeWidth: filled ? 1.6 : 2.6, fill: filled ? "#ffffff" : "none", absoluteStrokeWidth: false }),
  );
  await sharp(Buffer.from(svg)).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`public/marks/${name}.png`);
  console.log(name);
}

for (const [n, I] of Object.entries(FILLED)) await render(n, I, true);
for (const [n, I] of Object.entries(LINED)) await render(n, I, false);
