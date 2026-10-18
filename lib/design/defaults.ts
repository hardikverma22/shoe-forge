import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "./types";

export function defaultDesign(product: ProductDef, name = "Untitled design"): Design {
  return {
    version: 1,
    productId: product.id,
    name,
    stage: "studio",
    graphics: [],
    parts: Object.fromEntries(product.parts.map((p) => [p.id, { ...p.default }])),
  };
}
