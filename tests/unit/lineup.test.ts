import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LINEUP } from "@/lib/products/lineup";
import { PRODUCTS, getProduct } from "@/lib/products";
import { defaultDesign } from "@/lib/design/defaults";
import { generateColorway } from "@/lib/design/colorways";
import { rules } from "./helpers";

type Manifest = {
  meshes: { mesh: string; material: string }[];
  regions: Record<string, { region: number; mean: string; share: number }[]>;
};
const manifest = (id: string): Manifest => JSON.parse(readFileSync(`public/models/${id}/manifest.json`, "utf8"));
const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, "_");
/** Regions deliberately left as modeled, like printing on the shoe. */
const PRINTS: Record<string, string[]> = {
  // The black PUMA logos printed on the insole.
  "puma-suede": ["material_0#2"],
};

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

      it("gives every material of the model to a part", () => {
        // An unowned material keeps its own color under any design (a purple stitch line on a
        // white Dunk), so every material must be a part's source or listed in its \`also\`.
        const owned = new Set(product.parts.flatMap((p) => [p.source!.material, ...(p.source!.also ?? []).map((a) => a.material)]));
        for (const mat of materials) expect(owned.has(mat), `${mat} has no part`).toBe(true);
      });

      it("gives every sizable region of a split texture to a part", () => {
        // Same for regions: an unowned one stays brown under a white outsole (the Old Skool tread).
        const owned = new Set(product.parts.flatMap((p) => [p.source!, ...(p.source!.also ?? [])].map((o) => `${o.material}#${o.region}`)));
        for (const [mat, regions] of Object.entries(m.regions)) {
          if (!product.parts.some((p) => p.source!.material === mat && p.source!.region !== undefined)) continue;
          for (const r of regions) if (r.share > 0.02 && !PRINTS[product.id]?.includes(`${mat}#${r.region}`)) expect(owned.has(`${mat}#${r.region}`), `${mat} region ${r.region} has no part`).toBe(true);
        }
      });

      it("points extra pieces at real materials and regions", () => {
        for (const part of product.parts)
          for (const a of part.source!.also ?? []) {
            expect(materials.has(a.material), `${part.id}: ${a.material}`).toBe(true);
            if (a.region === undefined) continue;
            expect(a.region, `${part.id}: ${a.material}#${a.region}`).toBeLessThan(m.regions[a.material]!.length);
            expect(a.color, `${part.id}: ${a.material}#${a.region}`).toBe(m.regions[a.material]![a.region]!.mean);
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
