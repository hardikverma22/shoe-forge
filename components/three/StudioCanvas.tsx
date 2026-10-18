"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";
import { studioAnchor } from "@/lib/three/studio-anchor";
import { computeAnchors } from "@/lib/three/anchors";
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

/** Projects the hovered (or selected) part's center to the screen for the DOM callout. */
function PartProjector({
  product,
  groups,
}: {
  product: ProductDef;
  groups: MutableRefObject<Record<string, THREE.Group | null>>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const layout = useSceneMeta((s) => s.layout);
  const v = useMemo(() => new THREE.Vector3(), []);
  const anchors = useRef<Map<string, THREE.Vector3> | null>(null);

  useFrame(() => {
    const ui = useStudioUI.getState();
    const id = ui.hoveredPart ?? ui.selectedPart;
    studioAnchor.part = id;
    const g = id ? groups.current[id] : null;
    if (layout && !anchors.current) anchors.current = computeAnchors(product, groups.current);
    const local = id ? anchors.current?.get(id) : undefined;
    if (local && g) {
      g.localToWorld(v.copy(local)).project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      studioAnchor.x = rect.left + ((v.x + 1) / 2) * size.width;
      studioAnchor.y = rect.top + ((1 - v.y) / 2) * size.height;
      studioAnchor.right = rect.right;
      studioAnchor.top = rect.top;
    }
    for (const fn of studioAnchor.listeners) fn();
  });
  return null;
}

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
  const groups = useRef<Record<string, THREE.Group | null>>({});
  return (
    <div role="img" aria-label={label} className="size-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [1.9, 1.0, 2.8], fov: 38, near: 0.05, far: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        // Neutral tone mapping keeps picked colors true (ACES shifts saturated blues toward violet).
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
        }}
        onPointerMissed={(e) => {
          // A click on empty space clears the selection, but not at the end of an orbit drag.
          if (interactive && e.type === "click")
            useStudioUI.getState().set({ hoveredPart: null, selectedGraphic: null });
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
            groupsRef={groups}
          >
            {children}
          </ProductModel>
          <PartProjector product={product} groups={groups} />
          {overlay}
          <CameraRig product={product} enabled={controlsEnabled} />
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
