// Dev helper: how long the home intro covers the page on a slow device (software WebGL, CPU
// throttled), like CI runners and old phones.  node scripts/qa/slow-device.mjs <baseUrl> [cpuRate]
import { chromium } from "playwright";
const [base, rate = "6"] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--disable-gpu", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(rate) });
const t0 = Date.now();
await page.goto(base, { waitUntil: "commit" });
try {
  await page.locator(".sf-loader").waitFor({ state: "detached", timeout: 30000 });
  console.log(`loader gone after ${Date.now() - t0} ms`);
} catch {
  console.log("loader STILL UP after 30 s", await page.locator(".sf-loader [ref], .sf-loader .display span").first().innerText().catch(() => ""));
}
await browser.close();
