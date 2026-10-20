// Dev helper: screenshots each shoe in the studio.  node scripts/shoot-studio.mjs <baseUrl> <outDir> [id ...]
import { chromium } from "playwright";
const [base, out, ...ids] = process.argv.slice(2);
const list = ids.length ? ids : ["air-force-1", "air-jordan-1", "dunk-low", "gazelle", "puma-suede", "old-skool", "chuck-taylor"];
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("pageerror", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(m.type(), m.text().slice(0, 200)); });
for (const id of list) {
  await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${id}.png` });
  // Second shot: the first colorway, to check the recolor.
  await page.locator("#tab-colorways").click();
  await page.locator("#panel-colorways button").nth(1).click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${id}-cw.png` });
  console.log("shot", id);
}
await browser.close();
