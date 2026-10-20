import { z } from "zod";

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

export const MATERIAL_IDS = [
  "leather",
  "suede",
  "knit",
  "mesh",
  "canvas",
  "rubber",
  "patent",
] as const;
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

/**
 * Where a part lives in a textured ("tint") model: a whole material, or one color region of it
 * (see scripts/region-masks.mjs). The part is recolored in a shader that keeps the texture's
 * own shading and detail.
 */
export const PartSource = z.object({
  material: z.string(),
  region: z.number().int().min(0).max(8).optional(),
  /** The color the model itself shows here, when the design's default differs from it (a gray
   *  mockup painted as a real colorway). Defaults to the part's default color. */
  color: z.string().optional(),
});
export type PartSource = z.infer<typeof PartSource>;

export const PartDef = z.object({
  id: z.string(),
  label: z.string(),
  /** Name of the glTF node for this part ("preset" products, see scripts/split-parts.mjs). */
  meshName: z.string().default(""),
  /** Material or region for this part ("tint" products). */
  source: PartSource.optional(),
  allowedMaterials: z.array(MaterialId).min(1),
  default: PartConfig,
  description: z.string(),
  /** Direction (model space) from the part's center to its most recognizable point; callouts point there. */
  anchor: Vec3.optional(),
  /** Camera view (an id from cameraViews) to show when the part is picked. Without it the camera
   *  turns to the side the part faces, underneath for soles (see lib/three/facing.ts). */
  view: z.string().optional(),
});
export type PartDef = z.infer<typeof PartDef>;

export const Rule = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("forbidMaterial"),
    part: z.string(),
    material: MaterialId,
    reason: z.string(),
  }),
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

export const NamedColor = z.object({ hex: Hex, name: z.string() });
export type NamedColor = z.infer<typeof NamedColor>;

export const CATEGORIES = ["Running", "Basketball", "Court", "Skate", "Terrace", "Canvas"] as const;

export const ProductDef = z.object({
  id: z.string(),
  name: z.string(),
  /**
   * "preset": untextured parts that take our PBR material presets (Forge Runner).
   * "tint": a textured model (often a photo scan) whose parts are recolored in place.
   */
  kind: z.enum(["preset", "tint"]).default("preset"),
  brand: z.string().default("Shoe Forge"),
  category: z.enum(CATEGORIES).default("Running"),
  /** Who made the 3D model, and under which license (shown in the studio and credits). */
  credit: z.object({ author: z.string(), url: z.string(), license: z.string() }).optional(),
  /** Turns the source model so the toe points +x, up is +y and the outer side faces +z (degrees). */
  orientation: z.object({ x: z.number().default(0), y: z.number().default(0), z: z.number().default(0) }).default({ x: 0, y: 0, z: 0 }),
  /** Named swatches shown in the studio (falls back to `palette`). */
  colors: z.array(NamedColor).optional(),
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
