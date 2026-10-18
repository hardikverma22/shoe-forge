/* eslint-disable react-hooks/immutability -- R3F: three.js objects are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { applyMaterial, useMaterialMaps, useTextureCache } from "@/lib/materials/textures";
import { computeLayout } from "@/lib/three/layout";
import { useSceneMeta } from "@/lib/three/scene-store";

/**
 * The part mesh keeps its node transform (the optimizer stores quantization scale there),
 * then gets the layout transform (center + fit). Decomposed into props for R3F.
 */
function partTransform(source: THREE.Mesh, layout: { scale: number; offset: [number, number, number] }) {
  const layoutMatrix = new THREE.Matrix4()
    .makeTranslation(layout.offset[0], layout.offset[1], layout.offset[2])
    .multiply(new THREE.Matrix4().makeScale(layout.scale, layout.scale, layout.scale));
  const m = layoutMatrix.multiply(source.matrixWorld.clone());
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  m.decompose(position, quaternion, scale);
  return { position: position.toArray() as [number, number, number], quaternion, scale: scale.toArray() as [number, number, number] };
}

export type SurfaceKind = "down" | "move" | "up" | "click";
export type SurfaceEvent = ThreeEvent<PointerEvent | MouseEvent>;

type Props = {
  product: ProductDef;
  design: Design;
  /** 0 = assembled, 1 = fully exploded. */
  explode?: number;
  accent?: string;
  interactive?: boolean;
  /** Decals and other content rendered inside a part's mesh (so they project onto its surface). */
  /** When set, the explode amount is read from this ref every frame (no React re-render). */
  explodeRef?: { current: number };
  children?: (partId: string) => ReactNode;
  onSurface?: (kind: SurfaceKind, partId: string, e: SurfaceEvent) => void;
};

export function ProductModel({ product, design, explode = 0, explodeRef, accent = "#2B3CFF", interactive = true, children, onSurface }: Props) {
  const partGroups = useRef<Record<string, THREE.Group | null>>({});
  const gltf = useGLTF(product.modelUrl);
  const maps = useMaterialMaps();
  const cached = useTextureCache();

  const layout = useMemo(
    () => computeLayout(gltf.scene, product.parts.map((p) => ({ id: p.id, meshName: p.meshName }))),
    [gltf.scene, product],
  );

  const rootRef = useRef<THREE.Group>(null);
  useEffect(() => {
    useSceneMeta.getState().setRoot(rootRef.current);
  }, []);

  // Publish the layout so the camera, the stage and exports can use it.
  useEffect(() => {
    useSceneMeta.getState().setLayout(layout);
  }, [layout]);

  // One material per part, owned by us. The GLB's own materials are never mutated.
  const materials = useMemo(() => {
    const m: Record<string, THREE.MeshPhysicalMaterial> = {};
    for (const part of product.parts) m[part.id] = new THREE.MeshPhysicalMaterial({ color: "#ffffff" });
    return m;
  }, [product]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  // Material presets follow the design's part configs.
  useEffect(() => {
    for (const part of product.parts) {
      const cfg = design.parts[part.id];
      const mat = materials[part.id];
      if (cfg && mat) applyMaterial(mat, cfg, maps, cached, part.id);
    }
  }, [design.parts, materials, maps, cached, product.parts]);

  // Colors ease toward their targets in useFrame, so changes never re-render React.
  const targets = useMemo(() => new Map<string, THREE.Color>(), []);
  const highlight = useMemo(() => new THREE.Color(accent), [accent]);
  const black = useMemo(() => new THREE.Color("#000000"), []);
  useEffect(() => {
    for (const part of product.parts) {
      const cfg = design.parts[part.id];
      if (cfg) targets.set(part.id, new THREE.Color(cfg.color));
    }
  }, [design.parts, product.parts, targets]);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.002, dt); // frame-rate independent, about 250 ms to settle
    const ui = useStudioUI.getState();
    const e = explodeRef ? explodeRef.current : explode;
    for (const part of product.parts) {
      const g = partGroups.current[part.id];
      const c = layout.partCenters[part.id];
      if (g && c) g.position.set(c[0] * e * 0.6, c[1] * e * 0.6, c[2] * e * 0.6);
    }
    for (const part of product.parts) {
      const mat = materials[part.id];
      const target = targets.get(part.id);
      if (!mat || !target) continue;
      mat.color.lerp(target, k);
      const active = interactive && (ui.hoveredPart === part.id || ui.selectedPart === part.id);
      mat.emissive.lerp(active ? highlight : black, k);
      mat.emissiveIntensity = active ? 0.12 : 0;
    }
  });

  const setHover = (id: string | null) => {
    if (!interactive) return;
    useStudioUI.getState().set({ hoveredPart: id });
    if (typeof document !== "undefined") document.body.style.cursor = id ? "pointer" : "";
  };

  return (
    <group ref={rootRef}>
      {product.parts.map((part) => {
        const source = gltf.scene.getObjectByName(part.meshName) as THREE.Mesh | undefined;
        if (!source) return null;
        const { position, quaternion, scale } = partTransform(source, layout);
        return (
          <group key={part.id} ref={(g) => { partGroups.current[part.id] = g; }}>
            <mesh
              name={part.id}
              geometry={source.geometry}
              material={materials[part.id]}
              position={position}
              quaternion={quaternion}
              scale={scale}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setHover(part.id);
              }}
              onPointerOut={() => setHover(null)}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                if (!interactive || !onSurface) return;
                e.stopPropagation();
                onSurface("down", part.id, e);
              }}
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                if (!interactive || !onSurface) return;
                onSurface("move", part.id, e);
              }}
              onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                if (!interactive || !onSurface) return;
                onSurface("up", part.id, e);
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                if (!interactive) return;
                e.stopPropagation();
                useStudioUI.getState().set({ selectedPart: part.id });
                onSurface?.("click", part.id, e);
              }}
            >
              {children?.(part.id)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload("/models/forge-runner.glb");
