import { describe, expect, it } from "vitest";
import { compressToEncodedURIComponent } from "lz-string";
import { decodeDesign, encodeDesign } from "@/lib/design/codec";
import { defaultDesign } from "@/lib/design/defaults";
import { forgeRunner } from "@/lib/products/forge-runner";
import type { Design } from "@/lib/design/types";

const base = (): Design => defaultDesign(forgeRunner, "Round trip");

describe("design codec", () => {
  it("round-trips a design", () => {
    const d = base();
    const { value } = encodeDesign(d);
    expect(decodeDesign(value)).toEqual(d);
  });

  it("returns null for garbage and never throws", () => {
    expect(decodeDesign("not-a-design")).toBeNull();
    expect(decodeDesign("")).toBeNull();
  });

  it("drops uploaded images, which are too big for a URL", () => {
    const d: Design = {
      ...base(),
      graphics: [
        { id: "a", kind: "upload", src: "data:image/png;base64,AAAA", partId: "upper", position: [0, 0, 0], normal: [0, 0, 1], rotation: 0, scale: 0.1 },
        { id: "b", kind: "mark", src: "/marks/spark.png", partId: "upper", position: [0, 0, 0], normal: [0, 0, 1], rotation: 0, scale: 0.1 },
      ],
    };
    const { value, droppedUploads } = encodeDesign(d);
    expect(droppedUploads).toBe(1);
    expect(decodeDesign(value)?.graphics.map((g) => g.id)).toEqual(["b"]);
  });

  it("rejects marks that point outside our own folder", () => {
    const evil = { ...base(), graphics: [{ id: "x", kind: "mark", src: "https://evil.example/a.png", partId: "upper", position: [0, 0, 0], normal: [0, 0, 1], rotation: 0, scale: 0.1 }] };
    const value = compressToEncodedURIComponent(JSON.stringify(evil));
    expect(decodeDesign(value)?.graphics ?? []).toEqual([]);
  });

  it("rejects designs with invalid colors", () => {
    const bad = { ...base(), parts: { ...base().parts, upper: { material: "leather", color: "red" } } };
    expect(decodeDesign(compressToEncodedURIComponent(JSON.stringify(bad)))).toBeNull();
  });
});
