"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { ProductModel, type SurfaceEvent, type SurfaceKind } from "./ProductModel";
import { Stage } from "./Stage";
import { CameraRig } from "./CameraRig";

type Props = {
  product: ProductDef;
  design: Design;
  explode?: number;
  accent?: string;
  interactive?: boolean;
  controlsEnabled?: boolean;
  label: string;
  children?: (partId: string) => ReactNode;
  /** Extra scene content, for example the graphics placement layer. */
  overlay?: ReactNode;
  onSurface?: (kind: SurfaceKind, partId: string, e: SurfaceEvent) => void;
};

/** The 3D viewport. Client-only; import it with next/dynamic and ssr: false. */
export default function StudioCanvas({
  product,
  design,
  explode,
  accent,
  interactive = true,
  controlsEnabled = true,
  label,
  children,
  overlay,
  onSurface,
}: Props) {
  return (
    <div role="img" aria-label={label} className="size-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [1.9, 1.0, 2.8], fov: 40, near: 0.05, far: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        onPointerMissed={() => {
          if (interactive) useStudioUI.getState().set({ selectedPart: null, hoveredPart: null });
        }}
      >
        <Suspense fallback={null}>
          <Stage stage={design.stage} />
          <ProductModel
            product={product}
            design={design}
            explode={explode}
            accent={accent}
            interactive={interactive}
            onSurface={onSurface}
          >
            {children}
          </ProductModel>
          {overlay}
          <CameraRig product={product} enabled={controlsEnabled} />
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
