import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LINEUP } from "@/lib/products/lineup";
import { PRODUCTS, getProduct } from "@/lib/products";
import { defaultDesign } from "@/lib/design/defaults";
import { generateColorway } from "@/lib/design/colorways";
import { rules } from "./helpers";

type Manifest = {
  meshes: { mesh: string; material: string }[];
  regions: Record<string, { region: number; mean: string }[]>;
};
const manifest = (id: string): Manifest => JSON.parse(readFileSync(`public/models/${id}/manifest.json`, "utf8"));
const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, "_");

describe("brand lineup", () => {
  it("registers every shoe once", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of LINEUP) expect(getProduct(p.id)).toBe(p);
  });

  for (const product of LINEUP) {
    describe(product.id, () => {
      const m = manifest(product.id);
      const materials = new Set(m.meshes.map((x) => x.material));

      it("ships its model, thumbnail and credit", () => {
        expect(existsSync(`public${product.modelUrl}`)).toBe(true);
        expect(existsSync(`public/shoes/${product.id}.webp`)).toBe(true);
        expect(product.kind).toBe("tint");
        expect(product.credit?.author).toBeTruthy();
      });

      it("maps every part to a real material and region", () => {
        for (const part of product.parts) {
          const src = part.source!;
          expect(materials.has(src.material), `${part.id}: material ${src.material}`).toBe(true);
          if (src.region === undefined) continue;
          const regions = m.regions[src.material]!;
          expect(src.region, part.id).toBeLessThan(regions.length);
          // The default color is the region's own mean: an untouched part renders as scanned.
          expect(src.color ?? part.default.color, part.id).toBe(regions[src.region]!.mean);
          expect(existsSync(`public/models/${product.id}/${safe(src.material)}/mask-${Math.floor(src.region / 3)}.png`)).toBe(true);
        }
      });

      it("keeps one material and region per part", () => {
        const keys = product.parts.map((p) => `${p.source!.material}#${p.source!.region ?? "all"}`);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it("has colorways and graphic zones that name real parts", () => {
        const ids = new Set(product.parts.map((p) => p.id));
        for (const z of product.graphicZones) expect(ids.has(z)).toBe(true);
        for (const c of product.colorways) for (const id of Object.keys(c.parts)) expect(ids.has(id), `${c.id}.${id}`).toBe(true);
      });

      it("builds a valid default design and surprise colorway", () => {
        expect(Object.keys(defaultDesign(product).parts)).toEqual(product.parts.map((p) => p.id));
        const out = generateColorway(product, 7);
        for (const [partId, cfg] of Object.entries(out)) expect(rules(product, partId, cfg!.material!)).toBeNull();
      });
    });
  }
});
