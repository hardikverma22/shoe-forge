import { describe, expect, it } from "vitest";
import { forgeRunner } from "@/lib/products/forge-runner";
import { materialBlockedReason, maxGraphics } from "@/lib/design/rules";

describe("rules", () => {
  it("says why a material isn't offered on a part", () => {
    expect(materialBlockedReason(forgeRunner, "sole", "patent")).toMatch(/isn.t made in this material/);
    expect(materialBlockedReason(forgeRunner, "laces", "leather")).toMatch(/isn.t made in this material/);
  });

  it("applies an explicit forbid rule when the part allows the material", () => {
    const product = {
      ...forgeRunner,
      rules: [{ type: "forbidMaterial" as const, part: "upper", material: "patent" as const, reason: "Patent cracks on this upper." }],
    };
    expect(materialBlockedReason(product, "upper", "patent")).toBe("Patent cracks on this upper.");
    expect(materialBlockedReason(product, "upper", "suede")).toBeNull();
  });

  it("caps graphics from the product rules", () => {
    expect(maxGraphics(forgeRunner)).toBe(4);
  });
});
