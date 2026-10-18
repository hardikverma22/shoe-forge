import type { MaterialId } from "@/lib/products/schema";

export type MaterialPreset = {
  id: MaterialId;
  label: string;
  description: string;
  roughness: number;
  sheen: number;
  clearcoat: number;
  clearcoatRoughness: number;
  normalScale: number;
  /** How soft the fabric sheen is (fabrics only). */
  sheenRoughness: number;
  /** How much lighter than the base color the sheen glows (0 = same color, 1 = white). */
  sheenLift: number;
  /** Texture tiling on the UVs, multiplied by the part scale. */
  repeat: number;
  /** Added to the base price for each part that uses this material. */
  priceDelta: number;
};

/**
 * Tuned under the studio light rig so each material reads at a glance: leather has a soft satin
 * grain, suede and knit drink the light with a colored sheen, mesh shows its holes, rubber is
 * dull, patent mirrors the softboxes.
 */
export const MATERIALS: Record<MaterialId, MaterialPreset> = {
  leather: {
    id: "leather",
    label: "Leather",
    description: "Smooth full-grain leather",
    roughness: 0.58,
    sheen: 0,
    sheenRoughness: 0.5,
    clearcoat: 0.08,
    clearcoatRoughness: 0.45,
    normalScale: 1.2,
    sheenLift: 0,
    repeat: 7,
    priceDelta: 12,
  },
  suede: {
    id: "suede",
    label: "Suede",
    description: "Soft napped suede",
    roughness: 1,
    sheen: 1,
    sheenRoughness: 0.9,
    clearcoat: 0,
    clearcoatRoughness: 0,
    normalScale: 1.6,
    sheenLift: 0.45,
    repeat: 10,
    priceDelta: 15,
  },
  knit: {
    id: "knit",
    label: "Knit",
    description: "Engineered knit, breathable",
    roughness: 0.92,
    sheen: 0.7,
    sheenRoughness: 0.6,
    clearcoat: 0,
    clearcoatRoughness: 0,
    normalScale: 1.5,
    sheenLift: 0.25,
    repeat: 20,
    priceDelta: 8,
  },
  mesh: {
    id: "mesh",
    label: "Mesh",
    description: "Open performance mesh",
    roughness: 0.82,
    sheen: 0.4,
    sheenRoughness: 0.5,
    clearcoat: 0,
    clearcoatRoughness: 0,
    normalScale: 2,
    sheenLift: 0.2,
    repeat: 16,
    priceDelta: 0,
  },
  canvas: {
    id: "canvas",
    label: "Canvas",
    description: "Heavy cotton canvas",
    roughness: 0.96,
    sheen: 0.25,
    sheenRoughness: 0.8,
    clearcoat: 0,
    clearcoatRoughness: 0,
    normalScale: 2.2,
    sheenLift: 0.15,
    repeat: 14,
    priceDelta: 0,
  },
  rubber: {
    id: "rubber",
    label: "Rubber",
    description: "Durable natural rubber",
    roughness: 0.74,
    sheen: 0,
    sheenRoughness: 0.5,
    clearcoat: 0,
    clearcoatRoughness: 0.8,
    normalScale: 0.7,
    sheenLift: 0,
    repeat: 5,
    priceDelta: 0,
  },
  patent: {
    id: "patent",
    label: "Patent",
    description: "High-gloss patent leather",
    roughness: 0.14,
    sheen: 0,
    sheenRoughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    normalScale: 0.04,
    sheenLift: 0,
    repeat: 2,
    priceDelta: 20,
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);
