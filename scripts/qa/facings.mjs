// Dev helper: prints each part's facing (direction and strength) as the studio computes it.
//   node scripts/qa/facings.mjs <baseUrl> <id> [id ...]
import { chromium } from "playwright";
const [base, ...ids] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
for (const id of ids) {
  await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
  await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);
  const f = await page.evaluate(() => window.__sfScene.getState().facings);
  console.log(id, Object.entries(f ?? {}).map(([k, v]) => `${k}: y ${v[1].toFixed(2)} len ${Math.hypot(...v).toFixed(2)}`).join(" | "));
}
await browser.close();
