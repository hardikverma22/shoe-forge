import { materialBlockedReason } from "@/lib/design/rules";
import type { ProductDef, MaterialId } from "@/lib/products/schema";

export const rules = (p: ProductDef, partId: string, m: MaterialId) => materialBlockedReason(p, partId, m);
