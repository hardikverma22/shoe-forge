"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import type { MaterialId, PartConfig, ProductDef } from "@/lib/products/schema";
import { materialBlockedReason, maxGraphics } from "./rules";
import type { Design, Graphic, StageId } from "./types";

type Actions = {
  load: (design: Design) => void;
  setPartColor: (partId: string, color: string) => void;
  /** Returns the blocking reason, or null when the change was applied. */
  setPartMaterial: (product: ProductDef, partId: string, material: MaterialId) => string | null;
  setPartFinish: (partId: string, patch: Partial<Pick<PartConfig, "roughness" | "sheen" | "scale">>) => void;
  resetPart: (product: ProductDef, partId: string) => void;
  applyParts: (parts: Record<string, Partial<PartConfig>>) => void;
  /** Returns an error message, or null when added. */
  addGraphic: (product: ProductDef, graphic: Graphic) => string | null;
  updateGraphic: (id: string, patch: Partial<Graphic>) => void;
  removeGraphic: (id: string) => void;
  setStage: (stage: StageId) => void;
  rename: (name: string) => void;
};

export type DesignState = { design: Design | null } & Actions;

export const useDesignStore = create<DesignState>()(
  temporal(
    immer((set, get) => ({
      design: null,

      load: (design) =>
        set((s) => {
          s.design = design;
        }),

      setPartColor: (partId, color) =>
        set((s) => {
          const part = s.design?.parts[partId];
          if (part) part.color = color;
        }),

      setPartMaterial: (product, partId, material) => {
        const reason = materialBlockedReason(product, partId, material);
        if (reason) return reason;
        set((s) => {
          const part = s.design?.parts[partId];
          if (!part) return;
          part.material = material;
          // Finish values belong to the material they were set on, so reset them.
          delete part.roughness;
          delete part.sheen;
        });
        return null;
      },

      setPartFinish: (partId, patch) =>
        set((s) => {
          const part = s.design?.parts[partId];
          if (part) Object.assign(part, patch);
        }),

      resetPart: (product, partId) =>
        set((s) => {
          const def = product.parts.find((p) => p.id === partId);
          if (def && s.design) s.design.parts[partId] = { ...def.default };
        }),

      applyParts: (parts) =>
        set((s) => {
          if (!s.design) return;
          for (const [id, patch] of Object.entries(parts)) {
            const part = s.design.parts[id];
            if (part) Object.assign(part, patch);
          }
        }),

      addGraphic: (product, graphic) => {
        const design = get().design;
        if (!design) return "No design loaded";
        const max = maxGraphics(product);
        if (design.graphics.length >= max) return `You can add up to ${max} graphics`;
        set((s) => {
          s.design?.graphics.push(graphic);
        });
        return null;
      },

      updateGraphic: (id, patch) =>
        set((s) => {
          const g = s.design?.graphics.find((x) => x.id === id);
          if (g) Object.assign(g, patch);
        }),

      removeGraphic: (id) =>
        set((s) => {
          if (s.design) s.design.graphics = s.design.graphics.filter((g) => g.id !== id);
        }),

      setStage: (stage) =>
        set((s) => {
          if (s.design) s.design.stage = stage;
        }),

      rename: (name) =>
        set((s) => {
          if (s.design) s.design.name = name.trim().slice(0, 40) || "Untitled design";
        }),
    })),
    {
      limit: 100,
      partialize: (state) => ({ design: state.design }),
      // Only record a history step when something actually changed.
      equality: (a, b) => a.design === b.design || JSON.stringify(a.design) === JSON.stringify(b.design),
    },
  ),
);

export const history = {
  undo: () => useDesignStore.temporal.getState().undo(),
  redo: () => useDesignStore.temporal.getState().redo(),
  pause: () => useDesignStore.temporal.getState().pause(),
  resume: () => useDesignStore.temporal.getState().resume(),
  clear: () => useDesignStore.temporal.getState().clear(),
  canUndo: () => useDesignStore.temporal.getState().pastStates.length > 0,
  canRedo: () => useDesignStore.temporal.getState().futureStates.length > 0,
};
