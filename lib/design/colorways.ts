import type { MaterialId, ProductDef } from "@/lib/products/schema";
import type { PartConfig } from "@/lib/products/schema";

/** Small, seedable RNG so generated colorways are deterministic in tests. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

const SCHEMES = {
  analogous: [-30, 30],
  complementary: [180, 180],
  triadic: [120, 240],
  split: [150, 210],
} as const;

const NEUTRALS = ["#F4F4F2", "#1B1B1F", "#C08A55"];

/**
 * Builds a harmonious colorway from one random base hue. Only materials the rules allow are used.
 * The same seed always gives the same colorway.
 */
export function generateColorway(product: ProductDef, seed = Date.now()): Record<string, Partial<PartConfig>> {
  const rand = mulberry32(seed);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
  const base = Math.floor(rand() * 360);
  const schemeName = pick(Object.keys(SCHEMES) as (keyof typeof SCHEMES)[]);
  const [a, b] = SCHEMES[schemeName];
  const accent1 = hslToHex(base + a, 70, 55);
  const accent2 = hslToHex(base + b, 65, 50);
  const upperColor = hslToHex(base, 45 + rand() * 30, 35 + rand() * 25);
  const lightTint = hslToHex(base, 60, 88);
  const sole = pick(NEUTRALS);

  const materialFor = (partId: string, preferred: MaterialId): MaterialId => {
    const part = product.parts.find((p) => p.id === partId);
    if (!part) return preferred;
    return part.allowedMaterials.includes(preferred) ? preferred : part.default.material;
  };

  // Colors by role, so any shoe works: the first part carries the base color, rubber is neutral,
  // laces follow the base or go white, and the remaining panels alternate the two accents.
  const laceColor = rand() > 0.5 ? upperColor : "#F4F4F2";
  const out: Record<string, Partial<PartConfig>> = {};
  let accent = 0;
  product.parts.forEach((part, i) => {
    const rubber = part.allowedMaterials.every((m) => m === "rubber");
    if (rubber) out[part.id] = { material: "rubber", color: sole };
    else if (part.id.includes("lace")) out[part.id] = { material: materialFor(part.id, "canvas"), color: laceColor };
    else if (part.id === "lining") out[part.id] = { material: materialFor(part.id, "mesh"), color: lightTint };
    else if (i === 0) out[part.id] = { material: materialFor(part.id, part.default.material), color: upperColor };
    else out[part.id] = { material: materialFor(part.id, part.default.material), color: accent++ % 2 ? accent1 : accent2 };
  });
  return out;
}
