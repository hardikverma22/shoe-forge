import type { MaterialId, ProductDef } from "@/lib/products/schema";

/** Returns why a material can't be used on a part, or null when it's allowed. */
export function materialBlockedReason(product: ProductDef, partId: string, material: MaterialId): string | null {
  const part = product.parts.find((p) => p.id === partId);
  if (!part) return "Unknown part";
  if (!part.allowedMaterials.includes(material)) {
    return `${part.label} isn't made in this material`;
  }
  const rule = product.rules.find(
    (r) => r.type === "forbidMaterial" && r.part === partId && r.material === material,
  );
  return rule && rule.type === "forbidMaterial" ? rule.reason : null;
}

export function maxGraphics(product: ProductDef): number {
  const rule = product.rules.find((r) => r.type === "maxGraphics");
  return rule && rule.type === "maxGraphics" ? rule.max : 4;
}
