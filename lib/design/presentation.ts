import type { ColorwayPreset, ProductDef } from "@/lib/products/schema";
import { encodeDesign } from "./codec";
import { defaultDesign } from "./defaults";
import type { Design } from "./types";

/** A full design: the product defaults with a colorway's parts laid over them. */
export function designFromColorway(product: ProductDef, colorway: ColorwayPreset): Design {
  const d = defaultDesign(product, colorway.name);
  for (const [id, patch] of Object.entries(colorway.parts)) {
    const base = d.parts[id];
    if (base) d.parts[id] = { ...base, ...patch };
  }
  return d;
}

/** Studio URL that opens with this exact design. */
export function studioHref(design: Design): string {
  return `/studio/${design.productId}?d=${encodeDesign(design).value}`;
}

function channel(hex: string, i: number) {
  return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
}

export function luminance(hex: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return (
    0.2126 * lin(channel(hex, 0)) + 0.7152 * lin(channel(hex, 1)) + 0.0722 * lin(channel(hex, 2))
  );
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function saturation(hex: string): number {
  const r = channel(hex, 0);
  const g = channel(hex, 1);
  const b = channel(hex, 2);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** Text color for a printed field: ink or white, whichever reads better. */
export function inkOn(hex: string): "#0A0A12" | "#FFFFFF" {
  return contrast(hex, "#0A0A12") >= contrast(hex, "#FFFFFF") ? "#0A0A12" : "#FFFFFF";
}

/**
 * The page stock for a colorway: its most saturated color, or ink for near-neutral pairs.
 * Used to drench the colorway section in the pair's own color.
 */
export function stockFor(colorway: ColorwayPreset): { field: string; ink: string } {
  const colors = Object.values(colorway.parts)
    .map((p) => p?.color)
    .filter((c): c is string => Boolean(c));
  const best = colors.reduce<string | null>(
    (acc, c) => (acc === null || saturation(c) > saturation(acc) ? c : acc),
    null,
  );
  const field = best && saturation(best) > 0.35 ? best.toUpperCase() : "#0A0A12";
  return { field, ink: inkOn(field) };
}

/** Multiplies a color toward black, the way the material relief darkens a swatch. */
export function shade(hex: string, factor: number): string {
  const h = (i: number) =>
    Math.round(channel(hex, i) * factor * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${h(0)}${h(1)}${h(2)}`.toUpperCase();
}
