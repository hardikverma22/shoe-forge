"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getProduct } from "@/lib/products";
import { defaultDesign } from "@/lib/design/defaults";
import type { Design } from "@/lib/design/types";
import type { PartConfig, ProductDef } from "@/lib/products/schema";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";

const StudioCanvas = dynamic(() => import("@/components/three/StudioCanvas"), { ssr: false });

declare global {
  interface Window {
    /** Dev QA hook (scripts/qa/sweep.mjs): repaint parts and move the camera without reloading. */
    __sfQA?: {
      product: ProductDef;
      paint: (parts: Record<string, Partial<PartConfig>>) => void;
      reset: () => void;
      view: (id: string) => void;
      /** The model's root group, for inspecting materials and uniforms. */
      root: () => unknown;
    };
  }
}

export function RenderView({ productId }: { productId: string }) {
  const product = getProduct(productId)!;
  const [design, setDesign] = useState<Design>(() => defaultDesign(product));
  const ready = useSceneMeta((s) => s.layout !== null);

  useEffect(() => {
    useSceneMeta.getState().setLayout(null);
    useStudioUI.getState().set({ selectedPart: null, hoveredPart: null, view: "side", cameraNonce: 1 });
    window.__sfQA = {
      product,
      paint: (parts) =>
        setDesign((d) => ({
          ...d,
          parts: Object.fromEntries(Object.entries(d.parts).map(([id, cfg]) => [id, { ...cfg, ...parts[id] }])),
        })),
      reset: () => setDesign(defaultDesign(product)),
      view: (id) => useStudioUI.getState().set({ view: id, cameraNonce: useStudioUI.getState().cameraNonce + 1 }),
      root: () => useSceneMeta.getState().root,
    };
    return () => {
      delete window.__sfQA;
    };
  }, [product]);

  return (
    <div data-ready={ready} className="fixed inset-0">
      <StudioCanvas product={product} design={design} interactive={false} controlsEnabled={false} label={product.name} />
    </div>
  );
}
