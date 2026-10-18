import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import { PartConfig, Vec3 } from "@/lib/products/schema";
import type { Design } from "./types";

const SharedGraphic = z.object({
  id: z.string(),
  kind: z.enum(["mark", "text"]),
  src: z.string().optional(),
  text: z.string().max(12).optional(),
  font: z.string().max(60).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  partId: z.string(),
  position: Vec3,
  normal: Vec3,
  rotation: z.number(),
  scale: z.number().min(0.01).max(1),
});

const SharedDesign = z.object({
  version: z.literal(1),
  productId: z.string().max(60),
  name: z.string().max(40),
  parts: z.record(z.string(), PartConfig),
  graphics: z.array(SharedGraphic).max(4),
  stage: z.enum(["studio", "daylight", "sunset", "night"]),
});

const SAFE_MARK = /^\/marks\/[a-z-]+\.png$/;

/**
 * Serializes a design into a URL-safe string. Uploaded images are dropped because
 * they're too large for a URL. Text graphics keep their text and are re-rendered on load.
 */
export function encodeDesign(design: Design): { value: string; droppedUploads: number } {
  const kept = design.graphics.filter((g) => g.kind !== "upload");
  const slim: Design = {
    ...design,
    graphics: kept.map((g) => (g.kind === "text" ? { ...g, src: undefined } : g)),
  };
  return {
    value: compressToEncodedURIComponent(JSON.stringify(slim)),
    droppedUploads: design.graphics.length - kept.length,
  };
}

/** Returns null for anything that doesn't validate. Never throws. */
export function decodeDesign(value: string): Design | null {
  try {
    const json = decompressFromEncodedURIComponent(value);
    if (!json) return null;
    const parsed = SharedDesign.safeParse(JSON.parse(json));
    if (!parsed.success) return null;
    const design = parsed.data;
    // Marks are the only allowed external images, and only from our own folder.
    const graphics = design.graphics.filter((g) => g.kind !== "mark" || (g.src !== undefined && SAFE_MARK.test(g.src)));
    return { ...design, graphics } as Design;
  } catch {
    return null;
  }
}
