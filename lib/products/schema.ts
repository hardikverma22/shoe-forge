import { z } from "zod";

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

export const MATERIAL_IDS = ["leather", "suede", "knit", "mesh", "canvas", "rubber", "patent"] as const;
export const MaterialId = z.enum(MATERIAL_IDS);
export type MaterialId = z.infer<typeof MaterialId>;

export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PartConfig = z.object({
  material: MaterialId,
  color: Hex,
  roughness: z.number().min(0).max(1).optional(),
  sheen: z.number().min(0).max(1).optional(),
  scale: z.number().min(0.25).max(4).optional(),
});
export type PartConfig = z.infer<typeof PartConfig>;

export const PartDef = z.object({
  id: z.string(),
  label: z.string(),
  /** Name of the glTF node for this part (see scripts/split-parts.mjs). */
  meshName: z.string(),
  allowedMaterials: z.array(MaterialId).min(1),
  default: PartConfig,
  description: z.string(),
});
export type PartDef = z.infer<typeof PartDef>;

export const Rule = z.discriminatedUnion("type", [
  z.object({ type: z.literal("forbidMaterial"), part: z.string(), material: MaterialId, reason: z.string() }),
  z.object({ type: z.literal("maxGraphics"), max: z.number().int().min(0) }),
]);
export type Rule = z.infer<typeof Rule>;

export const CameraView = z.object({ id: z.string(), label: z.string(), position: Vec3 });
export type CameraView = z.infer<typeof CameraView>;

export const ColorwayPreset = z.object({
  id: z.string(),
  name: z.string(),
  story: z.string(),
  parts: z.record(z.string(), PartConfig.partial()),
});
export type ColorwayPreset = z.infer<typeof ColorwayPreset>;

export const ProductDef = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  modelUrl: z.string(),
  basePrice: z.number().positive(),
  currency: z.enum(["EUR", "USD"]),
  /** Real-world length of the shoe in meters, used for AR scale. */
  realLengthMeters: z.number().positive(),
  parts: z.array(PartDef).min(1),
  palette: z.array(Hex).length(12),
  cameraViews: z.array(CameraView).min(1),
  graphicZones: z.array(z.string()),
  rules: z.array(Rule),
  colorways: z.array(ColorwayPreset),
});
export type ProductDef = z.infer<typeof ProductDef>;
