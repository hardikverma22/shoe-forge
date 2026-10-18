import { forgeRunner } from "./forge-runner";
import type { ProductDef } from "./schema";

const products: Record<string, ProductDef> = {
  [forgeRunner.id]: forgeRunner,
};

export function getProduct(id: string): ProductDef | undefined {
  return products[id];
}

export const productIds = Object.keys(products);
