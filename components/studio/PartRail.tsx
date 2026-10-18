"use client";

import type { ProductDef } from "@/lib/products/schema";
import type { Design, StageId } from "@/lib/design/types";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { MATERIALS } from "@/lib/materials/presets";
import { track } from "@/lib/analytics";
import { Segmented } from "@/components/ui/primitives";

export const partNo = (i: number) => String(i + 1).padStart(2, "0");

export function pickPart(id: string) {
  const ui = useStudioUI.getState();
  ui.set({ selectedPart: id, selectedGraphic: null, focusNonce: ui.focusNonce + 1 });
  track("part_selected", { part: id });
}

const STAGES: { value: StageId; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "daylight", label: "Day" },
  { value: "sunset", label: "Sunset" },
  { value: "night", label: "Night" },
];

/** The tech-pack legend: every part, numbered, with its material and color. Desktop only. */
export function PartRail({ product, design }: { product: ProductDef; design: Design }) {
  const selected = useStudioUI((s) => s.selectedPart);
  const hovered = useStudioUI((s) => s.hoveredPart);
  const setStage = useDesignStore((s) => s.setStage);

  return (
    <nav
      aria-label="Parts"
      className="border-line bg-surface hidden w-[15.5rem] shrink-0 flex-col border-r lg:flex"
    >
      <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
        <h2 className="display text-[1.75rem]">Parts</h2>
        <span className="spec text-ink-muted">[ ] to step</span>
      </div>
      <ol className="flex-1 overflow-y-auto px-2.5 pb-3">
        {product.parts.map((p, i) => {
          const cfg = design.parts[p.id];
          const isSel = selected === p.id;
          const isHover = hovered === p.id && !isSel;
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-current={isSel ? "true" : undefined}
                onClick={() => pickPart(p.id)}
                onPointerEnter={() => useStudioUI.getState().set({ hoveredPart: p.id })}
                onPointerLeave={() => useStudioUI.getState().set({ hoveredPart: null })}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-200 ${
                  isSel ? "bg-select text-select-ink" : isHover ? "bg-ink/6" : "hover:bg-ink/6"
                }`}
              >
                <span
                  className={`spec grid size-7 shrink-0 place-items-center rounded-full border text-[0.625rem] font-bold transition-colors ${
                    isSel ? "border-select-ink bg-select-ink text-select" : "border-line-strong/40"
                  }`}
                >
                  {partNo(i)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.label}</span>
                  <span
                    className={`block truncate text-xs ${isSel ? "text-select-ink/70" : "text-ink-muted"}`}
                  >
                    {cfg ? MATERIALS[cfg.material].label : ""}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="border-ink/15 size-5 shrink-0 rounded-full border shadow-[inset_0_-2px_4px_rgb(0_0_0/0.12)]"
                  style={{ background: cfg?.color }}
                />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="border-line space-y-2 border-t px-5 py-4">
        <p className="text-ink-muted text-xs font-semibold">Lighting</p>
        <Segmented
          label="Stage lighting"
          size="sm"
          value={design.stage}
          options={STAGES}
          onChange={(v) => setStage(v)}
        />
      </div>
    </nav>
  );
}

/** Phone and tablet version: a row of numbered chips above the sheet. */
export function PartChips({ product, design }: { product: ProductDef; design: Design }) {
  const selected = useStudioUI((s) => s.selectedPart);
  return (
    <div
      role="group"
      aria-label="Parts"
      className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5 lg:hidden"
    >
      {product.parts.map((p, i) => {
        const isSel = selected === p.id;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={isSel}
            onClick={() => pickPart(p.id)}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-sm font-bold transition-colors ${
              isSel ? "border-select bg-select text-select-ink" : "border-line bg-surface"
            }`}
          >
            <span
              className="border-ink/15 size-6 rounded-full border"
              style={{ background: design.parts[p.id]?.color }}
              aria-hidden="true"
            />
            <span className="spec text-[0.625rem] opacity-70">{partNo(i)}</span>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
