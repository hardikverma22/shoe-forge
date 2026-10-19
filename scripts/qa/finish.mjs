// Dev helper: one part in each of its materials, close up, to check finishes are visible.
//   node scripts/qa/finish.mjs <baseUrl> <out.png> <id> <part label> <view> <material> [material ...]
import { chromium } from "playwright";
import sharp from "sharp";

const [base, out, id, partLabel, view, ...mats] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);
await page.getByRole("navigation", { name: "Parts" }).getByRole("button", { name: new RegExp(partLabel) }).click();
await page.getByRole("radio", { name: view, exact: true }).click();
const shots = [];
for (const m of mats) {
  await page.getByRole("radio", { name: m, exact: true }).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1500);
  shots.push(await page.screenshot({ clip: { x: 300, y: 150, width: 700, height: 560 } }));
}
const tiles = await Promise.all(shots.map((b) => sharp(b).resize(560, 448).toBuffer()));
await sharp({ create: { width: 560 * tiles.length, height: 448, channels: 3, background: "#fff" } })
  .composite(tiles.map((t, k) => ({ input: t, left: k * 560, top: 0 })))
  .png()
  .toFile(out);
await browser.close();
