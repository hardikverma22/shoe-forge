// Dev helper: one render of a shoe with some parts repainted, on the studio backdrop.
//   node scripts/qa/look.mjs <baseUrl> <out.png> <id> <view> [part=#hex[:material] | *=#hex ...]
// "*" paints every part. Uses the dev-only /render page (see scripts/qa/sweep.mjs).
import { chromium } from "playwright";
const [base, out, id, view, ...specs] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 }, reducedMotion: "reduce" });
await page.goto(`${base}/render/${id}`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "html,body{background:#e9e8e4!important}nextjs-portal{display:none!important}" });
await page.waitForSelector('[data-ready="true"]', { timeout: 60000 });
await page.waitForTimeout(2000);
const parts = await page.evaluate(() => window.__sfQA.product.parts.map((p) => p.id));
const patch = {};
for (const s of specs) {
  const [k, v] = s.split("=");
  const [color, material] = v.split(":");
  for (const p of k === "*" ? parts : [k]) patch[p] = { color, ...(material ? { material } : {}) };
}
await page.evaluate(({ patch, view }) => { window.__sfQA.paint(patch); window.__sfQA.view(view); }, { patch, view });
await page.waitForTimeout(1600);
await page.screenshot({ path: out });
await browser.close();
