"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";
import { studioAnchor } from "@/lib/three/studio-anchor";
import { computeAnchors } from "@/lib/three/anchors";
import { ProductModel, type SurfaceEvent, type SurfaceKind } from "./ProductModel";
import { TintModel } from "./TintModel";
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
  /** Graphics per part (built shoes) or per mesh name (textured "tint" shoes). */
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
  const v2 = useMemo(() => new THREE.Vector3(), []);
  const anchors = useRef<Map<string, THREE.Vector3> | null>(null);

  useFrame(() => {
    const ui = useStudioUI.getState();
    const id = ui.hoveredPart ?? ui.selectedPart;
    studioAnchor.part = id;
    // Textured shoes publish their anchors in the model root's space; built ones are per part group.
    const meta = useSceneMeta.getState();
    const published = id ? meta.anchors?.[id] : undefined;
    let g: THREE.Object3D | null | undefined = id ? groups.current[id] : null;
    let local: THREE.Vector3 | undefined;
    if (published) {
      g = meta.root;
      local = v2.set(...published);
    } else {
      if (layout && !anchors.current) anchors.current = computeAnchors(product, groups.current);
      local = id ? anchors.current?.get(id) : undefined;
    }
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

/**
 * Portrait viewports (phones) see less width than height: zoom out just enough that the whole
 * shoe length stays in frame from the default distance, instead of clipping the toe.
 */
function FitWidth() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useLayoutEffect(() => {
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    // Half the shoe length plus a margin, over the default camera distance.
    const needed = 0.95 / 3.5;
    const zoom = Math.min(1, (halfV * aspect) / needed);
    if (Math.abs(camera.zoom - zoom) > 1e-3) {
      // eslint-disable-next-line react-hooks/immutability -- R3F: the camera is mutated imperatively.
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect]);
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
          {product.kind === "tint" ? (
            <TintModel
              key={product.id}
              product={product}
              design={design}
              accent={accent}
              interactive={interactive}
              onSurface={onSurface}
            >
              {children}
            </TintModel>
          ) : (
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
          )}
          <PartProjector product={product} groups={groups} />
          {overlay}
          <CameraRig product={product} enabled={controlsEnabled} />
          <FitWidth />
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
