// Dev helper: films the home page's intro loader. Throttles the network so the pour is visible,
// and saves a contact sheet of frames.
//   node scripts/qa/intro-frames.mjs <baseUrl> <out.png> [width height] [kbps]
import { chromium } from "playwright";
import sharp from "sharp";

const [base, out, w = "1440", h = "900", kbps = "3000"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const cdp = await page.context().newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: (Number(kbps) * 1024) / 8, uploadThroughput: 1e6 });
const t0 = Date.now();
await page.goto(base, { waitUntil: "commit" });
const frames = [];
const stamps = [];
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(i < 2 ? 350 : 500);
  const gone = (await page.locator(".sf-loader").count()) === 0;
  frames.push(await page.screenshot());
  stamps.push(((Date.now() - t0) / 1000).toFixed(1) + (gone ? " (gone)" : ""));
  if (gone && frames.length > 3) {
    await page.waitForTimeout(1500);
    frames.push(await page.screenshot());
    stamps.push(((Date.now() - t0) / 1000).toFixed(1) + " +1.5s");
    break;
  }
}
// Keep about 12 frames evenly spread.
const pick = frames.map((_, i) => i).filter((i) => i % Math.max(1, Math.ceil(frames.length / 12)) === 0 || i >= frames.length - 3);
const tw = 480, th = Math.round((480 * Number(h)) / Number(w));
const tiles = await Promise.all(pick.map((i) => sharp(frames[i]).resize(tw, th).toBuffer()));
const cols = 4;
await sharp({ create: { width: tw * cols, height: th * Math.ceil(tiles.length / cols), channels: 3, background: "#fff" } })
  .composite(tiles.map((t, k) => ({ input: t, left: (k % cols) * tw, top: Math.floor(k / cols) * th })))
  .png()
  .toFile(out);
console.log("frames at", pick.map((i) => stamps[i]).join(" | "));
console.log("errors", errors);
await browser.close();
