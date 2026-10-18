"use client";

import { RotateCw } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import { useStudioUI } from "@/lib/design/ui-store";
import { Segmented } from "@/components/ui/primitives";

export function ViewBar({ product }: { product: ProductDef }) {
  const view = useStudioUI((s) => s.view);
  const autoRotate = useStudioUI((s) => s.autoRotate);
  const set = useStudioUI((s) => s.set);
  const nonce = useStudioUI((s) => s.cameraNonce);

  return (
    <div className="border-line bg-surface/90 pointer-events-auto ml-auto flex max-w-full items-center gap-1 rounded-full border p-1 shadow-[0_10px_30px_-18px_rgb(5_6_26/0.5)] backdrop-blur-md">
      <Segmented
        label="Camera view"
        size="sm"
        value={(view ?? "") as string}
        options={product.cameraViews.map((v) => ({ value: v.id, label: v.label }))}
        onChange={(id) => set({ view: id, cameraNonce: nonce + 1 })}
        className="[scrollbar-width:none] flex-nowrap overflow-x-auto bg-transparent"
      />
      <span aria-hidden="true" className="bg-line h-5 w-px" />
      <button
        type="button"
        aria-pressed={autoRotate}
        aria-label="Turntable"
        aria-keyshortcuts="Space"
        title="Turntable (Space)"
        onClick={() => set({ autoRotate: !autoRotate })}
        className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-full transition-colors ${
          autoRotate ? "bg-select text-select-ink" : "text-ink-muted hover:bg-ink/6 hover:text-ink"
        }`}
      >
        <RotateCw
          size={15}
          aria-hidden="true"
          className={autoRotate ? "animate-spin [animation-duration:3s]" : ""}
        />
      </button>
    </div>
  );
}
