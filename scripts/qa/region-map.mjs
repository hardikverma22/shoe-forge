// Dev helper: paints every part of a shoe a different loud color and shoots four views, so you can
// see at a glance which texture region each part controls.
//   node scripts/qa/region-map.mjs <baseUrl> <outDir> <id> [id ...] [--only 0-8]
// --only paints just that range of parts (0-based), for shoes with more parts than loud colors.
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const onlyAt = args.indexOf("--only");
const [lo, hi] = onlyAt >= 0 ? args.splice(onlyAt, 2)[1].split("-").map(Number) : [0, 99];
const [base, out, ...ids] = args;
const LOUD = ["Laser Pink", "Volt", "Game Royal", "Total Orange", "Pine Green", "Court Purple", "University Blue", "Varsity Maize", "University Red"];
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/studio/${id}`, { waitUntil: "networkidle" });
  await page.getByRole("status").waitFor({ state: "detached", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const parts = page.getByRole("navigation", { name: "Parts" }).getByRole("button");
  const n = await parts.count();
  const legend = [];
  for (let i = Math.max(0, lo); i < Math.min(n, hi + 1); i++) {
    await parts.nth(i).click();
    const name = LOUD[(i - lo) % LOUD.length];
    await page.getByRole("radiogroup", { name: "Palette" }).getByRole("radio", { name: new RegExp(`^${name} `) }).click();
    legend.push(`${(await parts.nth(i).innerText()).split("\n")[0]}=${name}`);
  }
  const shots = [];
  for (const view of ["Side", "Back", "Front", "Top"]) {
    await page.getByRole("radio", { name: view, exact: true }).click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1400);
    shots.push(await page.screenshot({ clip: { x: 250, y: 70, width: 800, height: 760 } }));
  }
  const tiles = await Promise.all(shots.map((b) => sharp(b).resize(600, 570).toBuffer()));
  await sharp({ create: { width: 1200, height: 1140, channels: 3, background: "#fff" } })
    .composite(tiles.map((t, k) => ({ input: t, left: (k % 2) * 600, top: Math.floor(k / 2) * 570 })))
    .png()
    .toFile(`${out}/map-${id}${onlyAt >= 0 ? `-${lo}-${hi}` : ""}.png`);
  console.log(id, legend.join(", "));
  await page.close();
}
await browser.close();
