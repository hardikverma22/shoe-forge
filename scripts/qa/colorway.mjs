// Dev helper: applies a shoe's colorways one by one and shoots each from 3/4.
//   node scripts/qa/colorway.mjs <baseUrl> <out.png> <id>
import { chromium } from "playwright";
import sharp from "sharp";
const [base, out, id] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);
const shots = [await page.screenshot({ clip: { x: 300, y: 150, width: 740, height: 560 } })];
await page.getByRole("tab", { name: "Colorways" }).click();
const buttons = page.locator("#panel-colorways ul button, #panel-colorways section button").filter({ hasNotText: "Surprise" });
const n = await buttons.count();
for (let i = 0; i < n; i++) {
  await buttons.nth(i).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1600);
  shots.push(await page.screenshot({ clip: { x: 300, y: 150, width: 740, height: 560 } }));
}
const tiles = await Promise.all(shots.map((b) => sharp(b).resize(444, 336).toBuffer()));
await sharp({ create: { width: 444 * tiles.length, height: 336, channels: 3, background: "#fff" } })
  .composite(tiles.map((t, k) => ({ input: t, left: k * 444, top: 0 })))
  .png()
  .toFile(out);
await browser.close();
