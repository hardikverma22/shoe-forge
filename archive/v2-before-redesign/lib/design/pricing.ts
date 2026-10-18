import { MATERIALS } from "@/lib/materials/presets";
import type { ProductDef } from "@/lib/products/schema";
import type { Design, GraphicKind } from "./types";

export const GRAPHIC_PRICE: Record<GraphicKind, number> = { mark: 6, upload: 10, text: 8 };

export function priceOf(product: ProductDef, design: Design) {
  const materials = Object.values(design.parts).reduce((sum, p) => sum + MATERIALS[p.material].priceDelta, 0);
  const graphics = design.graphics.reduce((sum, g) => sum + GRAPHIC_PRICE[g.kind], 0);
  return { base: product.basePrice, materials, graphics, total: product.basePrice + materials + graphics };
}

export function formatPrice(amount: number, currency: "EUR" | "USD"): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
