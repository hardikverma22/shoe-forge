// Dev helper: the screenshots in docs/images used by the README.
//   node scripts/qa/readme-shots.mjs <baseUrl>
import { chromium } from "playwright";
import sharp from "sharp";
const [base] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => { try { localStorage.setItem("theme", "light"); } catch {} });
const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const save = async (name) => {
  await hideDev();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1200);
  await sharp(await page.screenshot()).webp({ quality: 82 }).toFile(`docs/images/${name}.webp`);
};
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.locator(".sf-loader").waitFor({ state: "detached", timeout: 60000 });
await page.waitForTimeout(2500);
await save("home");
await page.goto(`${base}/studio/air-jordan-1`, { waitUntil: "networkidle" });
await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
await page.getByRole("tab", { name: "Colorways" }).click();
await page.getByRole("button", { name: /Royal Toe/ }).first().click();
await page.getByRole("tab", { name: "Part" }).click();
await page.waitForTimeout(4500); // let the "applied" toast clear
await save("studio");
await page.goto(`${base}/studio/dunk-low`, { waitUntil: "networkidle" });
await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
await page.getByRole("button", { name: /Change shoe/ }).click();
await save("switcher");
await page.goto(`${base}/shoes`, { waitUntil: "networkidle" });
await save("catalog");
await browser.close();
