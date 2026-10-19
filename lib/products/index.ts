import { forgeRunner } from "./forge-runner";
import { LINEUP } from "./lineup";
import type { ProductDef } from "./schema";

/** Every shoe in the studio: the brand lineup, then the original Forge Runner. */
export const PRODUCTS: ProductDef[] = [...LINEUP, forgeRunner];

const byId: Record<string, ProductDef> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function getProduct(id: string): ProductDef | undefined {
  return byId[id];
}

export const productIds = PRODUCTS.map((p) => p.id);
