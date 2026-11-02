// QA sweep: stress-tests every shoe's recoloring and writes a contact sheet plus a pass/fail report.
//   node scripts/qa/sweep.mjs <baseUrl> <outDir> [id ...]      (needs `npm run dev`)
//
// For each shoe, on the dev-only /render/<id> page:
//   1. All parts one color (white, black, red, royal), from five views. Pixels that keep another
//      hue are leaks: the source's own color showing through a recolor. They are painted magenta
//      on the sheet. Black must keep its shading (not a flat silhouette), white must read white.
//   2. Each part alone in a loud color: the part must visibly change something (else it is empty
//      or hidden), and what changes must take the picked hue.
//   3. Each part in each allowed material, in a mid color: the finish must not blow out or crush.
//   4. Every colorway, from three-quarters, for review by eye.
// Thresholds are deliberately loose: the report flags what needs a look, the sheet shows why.
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const [base, out, ...only] = process.argv.slice(2);
const ALL = ["air-force-1", "air-jordan-1", "dunk-low", "gazelle", "puma-suede", "old-skool", "chuck-taylor", "air-max-90", "forum-buckle", "bape-sta", "timberland-6-inch"];
const ids = only.length ? only : ALL;
const VIEWS = ["side", "three-quarter", "back", "top", "sole"];
const W = 720, H = 540;
const SETTLE = 1300; // color changes ease in over about a second

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, reducedMotion: "reduce" });
await mkdir(out, { recursive: true });

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
}
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

async function shoot() {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ omitBackground: true });
  const { data } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { png, data };
}
async function view(id) {
  await page.evaluate((v) => window.__sfQA.view(v), id);
  await page.waitForTimeout(250);
}
async function paint(parts, settle = SETTLE) {
  await page.evaluate((p) => window.__sfQA.paint(p), parts);
  await page.waitForTimeout(settle);
}

/** Leak analysis of an all-one-color render. Returns metrics and an overlay marking the leaks. */
function analyze(data, hex) {
  const [tr, tg, tb] = hexRgb(hex);
  const [th, ts, tv] = hsv(tr, tg, tb);
  const chromatic = ts > 0.4;
  const overlay = Buffer.from(data);
  let n = 0, leak = 0, sumV = 0, sumV2 = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    n++;
    const [h, s, v] = hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    sumV += v;
    sumV2 += v * v;
    let bad;
    if (chromatic) bad = (s > 0.22 && v > 0.12 && hueDist(h, th) > 40) || (s < 0.12 && v > 0.62);
    else if (tv > 0.5) bad = s > 0.3 && v > 0.2; // white: colored leftovers
    else bad = (s > 0.3 && v > 0.22) || v > 0.72; // black: colored or white leftovers (speculars are tiny)
    if (bad) {
      leak++;
      overlay[i] = 255;
      overlay[i + 1] = 0;
      overlay[i + 2] = 255;
    }
  }
  const mean = sumV / Math.max(n, 1);
  return { pixels: n, leak: leak / Math.max(n, 1), mean, std: Math.sqrt(Math.max(0, sumV2 / Math.max(n, 1) - mean * mean)), overlay };
}

/** Fraction of shoe pixels that differ from a baseline, and how many of those took the target hue. */
function diff(a, b, hex) {
  const [th] = hsv(...hexRgb(hex));
  let n = 0, changed = 0, onHue = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] < 200 && b[i + 3] < 200) continue;
    n++;
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d > 45) {
      changed++;
      const [h, s] = hsv(b[i] / 255, b[i + 1] / 255, b[i + 2] / 255);
      if (s > 0.2 && hueDist(h, th) < 40) onHue++;
    }
  }
  return { changed: changed / Math.max(n, 1), onHue: onHue / Math.max(changed, 1) };
}

/** Fraction of pixels in the changed area that are blown out or crushed. */
function extremes(a, b) {
  let changed = 0, blown = 0, crushed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (b[i + 3] < 200) continue;
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d <= 30) continue;
    changed++;
    const mx = Math.max(b[i], b[i + 1], b[i + 2]);
    if (mx > 250) blown++;
    if (mx < 6) crushed++;
  }
  return { changed, blown: blown / Math.max(changed, 1), crushed: crushed / Math.max(changed, 1) };
}

const tile = (buf, w, h, label, raw) =>
  sharp(buf, raw ? { raw: { width: W, height: H, channels: 4 } } : undefined)
    .flatten({ background: "#d9d9d6" })
    .resize(w, h, { fit: "contain", background: "#d9d9d6" })
    .composite([{ input: Buffer.from(`<svg width="${w}" height="18"><rect width="${w}" height="18" fill="#000" fill-opacity=".7"/><text x="4" y="13" fill="#ff0" font-family="Menlo" font-size="11">${label.replace(/[<&>]/g, "")}</text></svg>`), top: 0, left: 0 }])
    .png()
    .toBuffer();

async function sheet(rows, file, tw = 288, th = 216) {
  const cols = Math.max(...rows.map((r) => r.length));
  const comps = [];
  rows.forEach((r, y) => r.forEach((t, x) => comps.push({ input: t, left: x * tw, top: y * th })));
  await sharp({ create: { width: cols * tw, height: rows.length * th, channels: 3, background: "#fff" } }).composite(comps).jpeg({ quality: 82 }).toFile(file);
}

const PAINTS = { white: "#F4F4F2", black: "#111111", red: "#C8102E", royal: "#1F4FBF" };
const LOUD = ["#00B8F0", "#D7FF3A", "#F25C9C"];
const summary = [];

for (const id of ids) {
  await page.goto(`${base}/render/${id}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html,body{background:transparent!important}nextjs-portal{display:none!important}" });
  await page.waitForSelector('[data-ready="true"]', { timeout: 60000 });
  await page.waitForTimeout(2500);
  const product = await page.evaluate(() => window.__sfQA.product);
  const issues = [];
  const report = { id, colors: {}, parts: {}, finishes: {} };

  const baseline = {};
  for (const v of VIEWS) {
    await view(v);
    baseline[v] = await shoot();
  }

  // 1. All parts one color.
  const colorRows = [];
  for (const [name, hex] of Object.entries(PAINTS)) {
    await paint(Object.fromEntries(product.parts.map((p) => [p.id, { color: hex }])));
    const row = [];
    const metrics = {};
    for (const v of VIEWS) {
      await view(v);
      const { data } = await shoot();
      const a = analyze(data, hex);
      metrics[v] = { leak: +a.leak.toFixed(4), mean: +a.mean.toFixed(3), std: +a.std.toFixed(3) };
      row.push(await tile(a.overlay, 288, 216, `${name} ${v} leak ${(a.leak * 100).toFixed(1)}%`, true));
    }
    report.colors[name] = metrics;
    colorRows.push(row);
    const worst = Math.max(...Object.values(metrics).map((m) => m.leak));
    if (worst > 0.03) issues.push(`${name}: ${(worst * 100).toFixed(1)}% of pixels keep another color`);
    const side = metrics["three-quarter"];
    if (name === "black" && side.std < 0.03) issues.push(`black: flat, no shading (std ${side.std})`);
    if (name === "black" && side.mean < 0.05) issues.push(`black: crushed (mean ${side.mean})`);
    if (name === "white" && side.mean < 0.62) issues.push(`white: reads gray (mean ${side.mean})`);
    await page.evaluate(() => window.__sfQA.reset());
    await page.waitForTimeout(SETTLE);
  }

  // 2. Each part alone, in a loud color far from its default hue.
  const partRow = [];
  for (const part of product.parts) {
    const [dh] = hsv(...hexRgb(part.default.color));
    const hex = LOUD.reduce((best, c) => (hueDist(hsv(...hexRgb(c))[0], dh) > hueDist(hsv(...hexRgb(best))[0], dh) ? c : best));
    await paint({ [part.id]: { color: hex } });
    let best = { changed: 0, onHue: 0, v: "side", png: null };
    for (const v of VIEWS) {
      await view(v);
      const shot = await shoot();
      const d = diff(baseline[v].data, shot.data, hex);
      if (d.changed > best.changed) best = { ...d, v, png: shot.png };
    }
    report.parts[part.id] = { view: best.v, changed: +best.changed.toFixed(4), onHue: +best.onHue.toFixed(3) };
    if (best.changed < 0.0015) issues.push(`part ${part.id}: barely visible (${(best.changed * 100).toFixed(2)}% changes)`);
    // Thin prints are mostly anti-aliased edge pixels, so only judge the hue of real areas.
    else if (best.changed > 0.01 && best.onHue < 0.55) issues.push(`part ${part.id}: only ${(best.onHue * 100).toFixed(0)}% of its change takes the picked hue`);
    partRow.push(await tile(best.png ?? baseline.side.png, 288, 216, `${part.id} @${best.v} ${(best.changed * 100).toFixed(1)}%`));
    await paint({ [part.id]: { color: part.default.color } }, 900);
  }

  // 3. Each part in each allowed material.
  const finishRows = [];
  for (const part of product.parts) {
    if (part.allowedMaterials.length < 2) continue;
    const v = report.parts[part.id].view;
    await view(v);
    await paint({ [part.id]: { color: "#1F4FBF", material: part.default.material } });
    const row = [];
    for (const m of part.allowedMaterials) {
      await paint({ [part.id]: { color: "#1F4FBF", material: m } }, 500);
      const shot = await shoot();
      const e = extremes(baseline[v].data, shot.data);
      report.finishes[`${part.id}/${m}`] = { blown: +e.blown.toFixed(3), crushed: +e.crushed.toFixed(3) };
      if (e.blown > 0.08) issues.push(`finish ${part.id}/${m}: ${(e.blown * 100).toFixed(0)}% blown out`);
      if (e.crushed > 0.15) issues.push(`finish ${part.id}/${m}: ${(e.crushed * 100).toFixed(0)}% crushed to black`);
      row.push(await tile(shot.png, 288, 216, `${part.id} ${m}`));
    }
    finishRows.push(row);
    await paint({ [part.id]: { ...part.default } }, 900);
  }

  // 4. Colorways.
  await view("three-quarter");
  const cwRow = [await tile((await shoot()).png, 288, 216, "default")];
  for (const cw of product.colorways) {
    await page.evaluate(() => window.__sfQA.reset());
    await paint(cw.parts);
    cwRow.push(await tile((await shoot()).png, 288, 216, cw.name));
  }

  await sheet(colorRows, `${out}/${id}-colors.jpg`);
  await sheet(Array.from({ length: Math.ceil(partRow.length / 6) }, (_, r) => partRow.slice(r * 6, r * 6 + 6)), `${out}/${id}-parts.jpg`);
  if (finishRows.length) await sheet(finishRows, `${out}/${id}-finishes.jpg`);
  await sheet([cwRow], `${out}/${id}-colorways.jpg`);
  await writeFile(`${out}/${id}.json`, JSON.stringify({ ...report, issues }, null, 2));
  summary.push({ id, issues });
  console.log(`${issues.length ? "FLAG" : "ok  "} ${id}${issues.map((i) => `\n       - ${i}`).join("")}`);
}

await writeFile(`${out}/summary.json`, JSON.stringify(summary, null, 2));
await browser.close();
process.exitCode = summary.some((s) => s.issues.length) ? 1 : 0;
