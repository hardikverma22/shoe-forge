// Dev helper: paints one part a loud color and shoots it from a view.
//   node scripts/qa/paint-one.mjs <baseUrl> <out.png> <id> <part label> <view>
import { chromium } from "playwright";
const [base, out, id, label, view] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.getByRole("navigation", { name: "Parts" }).getByRole("button", { name: new RegExp(label) }).click();
await page.getByRole("radiogroup", { name: "Palette" }).getByRole("radio", { name: /^Laser Pink / }).click();
await page.getByRole("radio", { name: view, exact: true }).click();
await page.mouse.move(5, 5);
await page.waitForTimeout(1500);
await page.screenshot({ path: out, clip: { x: 250, y: 70, width: 800, height: 760 } });
await browser.close();
