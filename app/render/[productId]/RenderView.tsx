"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { getProduct } from "@/lib/products";
import { defaultDesign } from "@/lib/design/defaults";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";

const StudioCanvas = dynamic(() => import("@/components/three/StudioCanvas"), { ssr: false });

export function RenderView({ productId }: { productId: string }) {
  const product = getProduct(productId)!;
  const design = useMemo(() => defaultDesign(product), [product]);
  const ready = useSceneMeta((s) => s.layout !== null);

  useEffect(() => {
    useSceneMeta.getState().setLayout(null);
    useStudioUI.getState().set({ selectedPart: null, hoveredPart: null, view: "side", cameraNonce: 1 });
  }, []);

  return (
    <div data-ready={ready} className="fixed inset-0">
      <StudioCanvas product={product} design={design} interactive={false} controlsEnabled={false} label={product.name} />
    </div>
  );
}
