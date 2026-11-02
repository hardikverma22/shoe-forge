// Dev helper: prints each tint material's settings and slot-0 mean, from the live render page.
//   node scripts/qa/means.mjs <baseUrl> <id>
import { chromium } from "playwright";
const [base, id] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage();
await page.goto(`${base}/render/${id}`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-ready="true"]', { timeout: 60000 });
console.log(await page.evaluate(() => {
  const out = [], seen = new Set();
  window.__sfQA.root().traverse((o) => {
    if (!o.isMesh || seen.has(o.material.name)) return;
    seen.add(o.material.name);
    const m = o.material, mean = m.userData.sfMeans?.[0];
    out.push(`${m.name} mean0=${mean ? [mean.x, mean.y, mean.z].map((v) => v.toFixed(3)).join(",") : "-"} color=${m.color.getHexString()} rough=${m.roughness.toFixed(2)} metal=${m.metalness} normal=${!!m.normalMap} ao=${!!m.aoMap} spec=${m.specularIntensity} specColor=${m.specularColor?.getHexString()} ior=${m.ior}`);
  });
  return out.join("\n");
}));
await browser.close();
