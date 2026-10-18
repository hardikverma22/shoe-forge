import { describe, expect, it } from "vitest";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { ProductDef } from "@/lib/products/schema";

describe("Forge Runner config", () => {
  it("validates against the schema", () => {
    expect(ProductDef.safeParse(forgeRunner).success).toBe(true);
  });

  it("uses each mesh name once and an allowed default material per part", () => {
    const names = forgeRunner.parts.map((p) => p.meshName);
    expect(new Set(names).size).toBe(names.length);
    for (const part of forgeRunner.parts) {
      expect(part.allowedMaterials).toContain(part.default.material);
      expect(MATERIALS[part.default.material]).toBeDefined();
    }
  });

  it("has 12 palette colors and colorways that only use real parts", () => {
    expect(forgeRunner.palette).toHaveLength(12);
    const ids = new Set(forgeRunner.parts.map((p) => p.id));
    for (const c of forgeRunner.colorways) {
      for (const partId of Object.keys(c.parts)) expect(ids.has(partId)).toBe(true);
    }
  });
});
