import { describe, expect, it } from "vitest";
import { forgeRunner } from "@/lib/products/forge-runner";
import { generateColorway, hslToHex, mulberry32 } from "@/lib/design/colorways";
import { rules } from "./helpers";

describe("colorways", () => {
  it("is deterministic for the same seed", () => {
    expect(generateColorway(forgeRunner, 42)).toEqual(generateColorway(forgeRunner, 42));
  });

  it("only uses materials each part allows", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const out = generateColorway(forgeRunner, seed);
      for (const [partId, cfg] of Object.entries(out)) {
        expect(rules(forgeRunner, partId, cfg!.material!)).toBeNull();
      }
    }
  });

  it("produces valid hex colors", () => {
    expect(hslToHex(200, 50, 50)).toMatch(/^#[0-9A-F]{6}$/);
    const r = mulberry32(7);
    expect(r()).toBeGreaterThanOrEqual(0);
    expect(r()).toBeLessThan(1);
  });
});
