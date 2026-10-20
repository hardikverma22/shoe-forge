// Dev helper: clicks every part of a shoe in the parts list and shoots where the camera lands.
//   node scripts/qa/focus-parts.mjs <baseUrl> <outDir> <id> [id ...]
import { chromium } from "playwright";
import sharp from "sharp";
const [base, out, ...ids] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
  await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const parts = page.getByRole("navigation", { name: "Parts" }).getByRole("button");
  const n = await parts.count();
  const shots = [];
  const names = [];
  for (let i = 0; i < n; i++) {
    await parts.nth(i).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1300);
    names.push((await parts.nth(i).innerText()).split("\n")[1]);
    shots.push(await page.screenshot({ clip: { x: 250, y: 70, width: 940, height: 760 } }));
  }
  const tw = 376, th = 304, cols = 5;
  const tiles = await Promise.all(shots.map((b) => sharp(b).resize(tw, th).toBuffer()));
  await sharp({ create: { width: tw * cols, height: th * Math.ceil(tiles.length / cols), channels: 3, background: "#fff" } })
    .composite(tiles.map((t, k) => ({ input: t, left: (k % cols) * tw, top: Math.floor(k / cols) * th })))
    .png()
    .toFile(`${out}/focus-${id}.png`);
  console.log(id, names.join(", "));
  await page.close();
}
await browser.close();
