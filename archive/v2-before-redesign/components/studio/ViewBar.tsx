"use client";

import { RotateCw } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import { useStudioUI } from "@/lib/design/ui-store";
import { Segmented } from "@/components/ui/primitives";

export function ViewBar({ product, className = "" }: { product: ProductDef; className?: string }) {
  const view = useStudioUI((s) => s.view);
  const autoRotate = useStudioUI((s) => s.autoRotate);
  const set = useStudioUI((s) => s.set);
  const nonce = useStudioUI((s) => s.cameraNonce);

  return (
    <div className={`glass absolute left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-2 py-1.5 lg:left-[calc((100%-380px)/2)] ${className}`}>
      <Segmented
        label="Camera view"
        value={(view ?? "") as string}
        options={product.cameraViews.map((v) => ({ value: v.id, label: v.label }))}
        onChange={(id) => set({ view: id, cameraNonce: nonce + 1 })}
        className="flex-nowrap overflow-x-auto"
      />
      <button
        type="button"
        aria-pressed={autoRotate}
        aria-label="Auto-rotate"
        onClick={() => set({ autoRotate: !autoRotate })}
        className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${
          autoRotate ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"
        }`}
      >
        <RotateCw size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
