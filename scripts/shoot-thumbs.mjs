// Renders the catalog thumbnails: each shoe's side profile on a transparent background.
//   node scripts/shoot-thumbs.mjs <baseUrl> [id ...]     (needs `npm run dev`; writes public/shoes/<id>.webp)
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const [base, ...ids] = process.argv.slice(2);
const list = ids.length ? ids : ["air-force-1", "air-jordan-1", "dunk-low", "gazelle", "puma-suede", "old-skool", "chuck-taylor", "forge-runner"];
await mkdir("public/shoes", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1.5 });
for (const id of list) {
  await page.goto(`${base}/render/${id}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html,body{background:transparent!important}nextjs-portal{display:none!important}" });
  await page.waitForSelector('[data-ready="true"]');
  await page.waitForTimeout(2500);
  const png = await page.screenshot({ omitBackground: true });
  await sharp(png).trim({ threshold: 1 }).resize(1200, 720, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 86, alphaQuality: 90 }).toFile(`public/shoes/${id}.webp`);
  console.log("thumb", id);
}
await browser.close();
