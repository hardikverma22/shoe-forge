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
  /** Texture tiling on the UVs, multiplied by the part scale. */
  repeat: number;
  /** Added to the base price for each part that uses this material. */
  priceDelta: number;
};

export const MATERIALS: Record<MaterialId, MaterialPreset> = {
  leather: { id: "leather", label: "Leather", description: "Smooth full-grain leather", roughness: 0.55, sheen: 0, clearcoat: 0.15, clearcoatRoughness: 0.6, normalScale: 0.6, repeat: 2, priceDelta: 12 },
  suede: { id: "suede", label: "Suede", description: "Soft napped suede", roughness: 0.95, sheen: 1, clearcoat: 0, clearcoatRoughness: 0, normalScale: 0.4, repeat: 3, priceDelta: 15 },
  knit: { id: "knit", label: "Knit", description: "Engineered knit, breathable", roughness: 0.85, sheen: 0.6, clearcoat: 0, clearcoatRoughness: 0, normalScale: 1, repeat: 5, priceDelta: 8 },
  mesh: { id: "mesh", label: "Mesh", description: "Open performance mesh", roughness: 0.8, sheen: 0.3, clearcoat: 0, clearcoatRoughness: 0, normalScale: 1.2, repeat: 6, priceDelta: 0 },
  canvas: { id: "canvas", label: "Canvas", description: "Heavy cotton canvas", roughness: 0.9, sheen: 0.2, clearcoat: 0, clearcoatRoughness: 0, normalScale: 0.8, repeat: 4, priceDelta: 0 },
  rubber: { id: "rubber", label: "Rubber", description: "Durable natural rubber", roughness: 0.7, sheen: 0, clearcoat: 0.05, clearcoatRoughness: 0.8, normalScale: 0.5, repeat: 3, priceDelta: 0 },
  patent: { id: "patent", label: "Patent", description: "High-gloss patent leather", roughness: 0.2, sheen: 0, clearcoat: 1, clearcoatRoughness: 0.05, normalScale: 0.1, repeat: 2, priceDelta: 20 },
};

export const MATERIAL_LIST = Object.values(MATERIALS);
