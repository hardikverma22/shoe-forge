import { beforeEach, describe, expect, it } from "vitest";
import { useDesignStore, history } from "@/lib/design/store";
import { createHistoryGesture } from "@/lib/design/gesture";
import { defaultDesign } from "@/lib/design/defaults";
import { forgeRunner } from "@/lib/products/forge-runner";

beforeEach(() => {
  useDesignStore.getState().load(defaultDesign(forgeRunner));
  history.clear();
});

describe("design store history", () => {
  it("undoes a single change", () => {
    const before = useDesignStore.getState().design!.parts.upper!.color;
    useDesignStore.getState().setPartColor("upper", "#2B3CFF");
    history.undo();
    expect(useDesignStore.getState().design!.parts.upper!.color).toBe(before);
  });

  it("records a whole color drag as one undo step", () => {
    const start = useDesignStore.getState().design!.parts.upper!.color;
    const gesture = createHistoryGesture<string>((c) => useDesignStore.getState().setPartColor("upper", c));
    gesture.onStart(start);
    for (const c of ["#111111", "#222222", "#333333", "#444444"]) gesture.onChange(c);
    gesture.onEnd("#444444");
    expect(useDesignStore.getState().design!.parts.upper!.color).toBe("#444444");

    history.undo();
    expect(useDesignStore.getState().design!.parts.upper!.color).toBe(start);
  });

  it("refuses a material that the rules block, and leaves the design unchanged", () => {
    const before = useDesignStore.getState().design!.parts.sole!.material;
    const reason = useDesignStore.getState().setPartMaterial(forgeRunner, "sole", "patent");
    expect(reason).toMatch(/isn.t made in this material/);
    expect(useDesignStore.getState().design!.parts.sole!.material).toBe(before);
  });
});
