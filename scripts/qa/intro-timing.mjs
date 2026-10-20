// Dev helper: how long the intro loader covers the home page, on a first and a repeat visit, with
// and without reduced motion.  node scripts/qa/intro-timing.mjs <baseUrl> <outDir>
import { chromium } from "playwright";
const [base, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
for (const reduced of [false, true]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const visit of ["first", "repeat"]) {
    const t0 = Date.now();
    await page.goto(base, { waitUntil: "commit" });
    await page.locator(".sf-loader").waitFor({ state: "detached", timeout: 30000 });
    const ms = Date.now() - t0;
    await page.waitForTimeout(1200);
    const scrollY = await page.evaluate(() => window.scrollY);
    const locked = await page.evaluate(() => document.documentElement.classList.contains("sf-loading"));
    await page.screenshot({ path: `${out}/after-${reduced ? "reduced" : "motion"}-${visit}.png` });
    console.log(`${reduced ? "reduced" : "motion "} ${visit}: covered ${ms} ms, scrollY ${scrollY}, still locked ${locked}`);
  }
  console.log("errors", errors);
  await context.close();
}
await browser.close();
