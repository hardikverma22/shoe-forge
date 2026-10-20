/* eslint-disable react-hooks/immutability -- R3F: three.js objects are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Outlines, useGLTF } from "@react-three/drei";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { applyMaterial, useMaterialMaps, useTextureCache } from "@/lib/materials/textures";
import { MATERIALS } from "@/lib/materials/presets";
import { computeLayout } from "@/lib/three/layout";
import { useSceneMeta } from "@/lib/three/scene-store";
import { partFacing } from "@/lib/three/facing";

/** A copy of an attribute as plain floats (the optimizer stores positions and normals quantized). */
function floatAttribute(
  attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): THREE.BufferAttribute {
  const out = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++) {
    for (let c = 0; c < attr.itemSize; c++) out[i * attr.itemSize + c] = attr.getComponent(i, c);
  }
  return new THREE.BufferAttribute(out, attr.itemSize);
}

/**
 * Each part's geometry in model space: de-quantized and with its node transform plus the layout
 * (center + fit) baked in. Meshes then need no transform, so raycast hits, graphics and anchors
 * all live in one uniform space where the shoe is FIT_SIZE long.
 */
function bakePartGeometry(
  source: THREE.Mesh,
  layout: { scale: number; offset: [number, number, number] },
) {
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(source.geometry.attributes))
    g.setAttribute(name, floatAttribute(attr));
  if (source.geometry.index) g.setIndex(source.geometry.index.clone());
  const m = new THREE.Matrix4()
    .makeTranslation(layout.offset[0], layout.offset[1], layout.offset[2])
    .multiply(new THREE.Matrix4().makeScale(layout.scale, layout.scale, layout.scale))
    .multiply(source.matrixWorld);
  g.applyMatrix4(m);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
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
  /** Spreads the explode over the parts in order, 0 = all together. */
  stagger?: number;
  /** How far apart the parts travel when fully exploded. */
  spread?: number;
  /** Designed explode directions per part (model space). Without it, parts move radially. */
  explodeOffsets?: Record<string, [number, number, number]>;
  /** Extra per-part travel along its explode direction, read every frame (0..1). */
  liftRef?: { current: Record<string, number> };
  /** A part to ring with a strong outline (used by guided tours). */
  focusPart?: string | null;
  /** Receives each part's group, so overlays can project part positions to the screen. */
  groupsRef?: MutableRefObject<Record<string, THREE.Group | null>>;
  /** Return false to ignore a pointer event (for example when it started on a DOM button). */
  gate?: (e: SurfaceEvent) => boolean;
  children?: (partId: string) => ReactNode;
  onSurface?: (kind: SurfaceKind, partId: string, e: SurfaceEvent) => void;
};

export function ProductModel({
  product,
  design,
  explode = 0,
  explodeRef,
  accent = "#FF4A1C",
  interactive = true,
  stagger = 0,
  spread = 0.75,
  explodeOffsets,
  liftRef,
  focusPart = null,
  groupsRef,
  gate,
  children,
  onSurface,
}: Props) {
  const ownGroups = useRef<Record<string, THREE.Group | null>>({});
  const partGroups = groupsRef ?? ownGroups;
  const gltf = useGLTF(product.modelUrl);
  const maps = useMaterialMaps();
  const cached = useTextureCache();

  const layout = useMemo(
    () =>
      computeLayout(
        gltf.scene,
        product.parts.map((p) => ({ id: p.id, meshName: p.meshName })),
      ),
    [gltf.scene, product],
  );

  const geometries = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const out: Record<string, THREE.BufferGeometry> = {};
    for (const part of product.parts) {
      const source = gltf.scene.getObjectByName(part.meshName) as THREE.Mesh | undefined;
      if (source) out[part.id] = bakePartGeometry(source, layout);
    }
    return out;
  }, [gltf.scene, product, layout]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  const rootRef = useRef<THREE.Group>(null);
  useEffect(() => {
    useSceneMeta.getState().setRoot(rootRef.current);
  }, []);

  // Publish the layout so the camera, the stage and exports can use it. The floor is measured
  // from the baked geometry itself, so contact shadows sit exactly under the sole.
  useEffect(() => {
    let minY = Infinity;
    for (const g of Object.values(geometries)) minY = Math.min(minY, g.boundingBox?.min.y ?? Infinity);
    if (typeof window !== "undefined") (window as unknown as { __floor?: unknown }).__floor = { layout: layout.floorY, measured: minY };
    useSceneMeta.getState().setLayout(Number.isFinite(minY) ? { ...layout, floorY: minY } : layout);
    const center = new THREE.Vector3();
    const facings: Record<string, [number, number, number]> = {};
    for (const [id, g] of Object.entries(geometries)) facings[id] = partFacing([g], center).toArray();
    useSceneMeta.getState().setFacings(facings);
  }, [layout, geometries]);

  // One material per part, owned by us. The GLB's own materials are never mutated.
  const materials = useMemo(() => {
    const m: Record<string, THREE.MeshPhysicalMaterial> = {};
    for (const part of product.parts)
      // Double-sided: exploded parts and the open collar show their insides instead of black voids.
      m[part.id] = new THREE.MeshPhysicalMaterial({ color: "#ffffff", side: THREE.DoubleSide });
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
  const black = useMemo(() => new THREE.Color("#000000"), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  useEffect(() => {
    for (const part of product.parts) {
      const cfg = design.parts[part.id];
      if (cfg) targets.set(part.id, new THREE.Color(cfg.color));
    }
  }, [design.parts, product.parts, targets]);

  // Start a pulse whenever the selected part changes.
  const pulses = useRef<Record<string, number>>({});
  const clock = useThree((s) => s.clock);
  const selectedPart = useStudioUI((s) => s.selectedPart);
  const hoveredPart = useStudioUI((s) => s.hoveredPart);
  useEffect(() => {
    if (selectedPart) pulses.current[selectedPart] = clock.elapsedTime;
  }, [selectedPart, clock]);
  // ...and when a part's material changes, so the switch is unmistakable.
  const lastMaterial = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const part of product.parts) {
      const m = design.parts[part.id]?.material;
      if (!m) continue;
      const prev = lastMaterial.current[part.id];
      if (prev && prev !== m) pulses.current[part.id] = clock.elapsedTime;
      lastMaterial.current[part.id] = m;
    }
  }, [design.parts, product.parts, clock]);

  useFrame((state, dt) => {
    const k = 1 - Math.pow(0.002, dt); // frame-rate independent, about 250 ms to settle
    const e = explodeRef ? explodeRef.current : explode;
    const n = product.parts.length;
    for (let i = 0; i < n; i++) {
      const part = product.parts[i]!;
      const g = partGroups.current[part.id];
      const c = layout.partCenters[part.id];
      if (!g || !c) continue;
      // Staggered: each part starts a little later and all finish together.
      const local =
        stagger > 0 ? Math.min(1, Math.max(0, e * (1 + stagger * (n - 1)) - i * stagger)) : e;
      const s = local * local * (3 - 2 * local) + (liftRef?.current[part.id] ?? 0);
      const o = explodeOffsets?.[part.id];
      if (o) {
        g.position.set(o[0] * s, o[1] * s, o[2] * s);
        continue;
      }
      // Push along the part's direction from the center, with a floor so central parts move too.
      const len = Math.hypot(c[0], c[1], c[2]) || 1;
      const k = s * spread + (s * spread * 0.22) / len;
      g.position.set(c[0] * k, c[1] * k, c[2] * k);
    }
    for (const part of product.parts) {
      const mat = materials[part.id];
      const target = targets.get(part.id);
      if (!mat || !target) continue;
      mat.color.lerp(target, k);
      // Fabric sheen picks up the fabric's own color, so dark knits stay dark.
      const cfg = design.parts[part.id];
      mat.sheenColor.copy(mat.color).lerp(white, cfg ? MATERIALS[cfg.material].sheenLift : 0.2);
      // Never tint the part with a UI color: a black upper must stay black. Selection is shown
      // by a short white pulse and the hover outline instead.
      const since = state.clock.elapsedTime - (pulses.current[part.id] ?? -10);
      const pulse = interactive && since < 0.7 ? Math.pow(1 - since / 0.7, 2) * 0.35 : 0;
      mat.emissive.copy(pulse > 0 ? white : black);
      mat.emissiveIntensity = pulse;
    }
  });

  const allowed = (e: SurfaceEvent) => interactive && (!gate || gate(e));

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
        const geometry = geometries[part.id];
        if (!geometry) return null;
        return (
          <group
            key={part.id}
            ref={(g) => {
              partGroups.current[part.id] = g;
            }}
          >
            <mesh
              name={part.id}
              geometry={geometry}
              material={materials[part.id]}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                if (allowed(e)) setHover(part.id);
              }}
              onPointerOut={() => setHover(null)}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                if (!onSurface || !allowed(e)) return;
                e.stopPropagation();
                onSurface("down", part.id, e);
              }}
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                if (!onSurface || !allowed(e)) return;
                onSurface("move", part.id, e);
              }}
              onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                if (!interactive || !onSurface) return;
                onSurface("up", part.id, e);
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                if (!allowed(e)) return;
                e.stopPropagation();
                useStudioUI.getState().set({ selectedPart: part.id });
                onSurface?.("click", part.id, e);
              }}
            >
              {focusPart === part.id ? (
                <Outlines screenspace thickness={0.008} color="#d7ff3a" toneMapped={false} />
              ) : interactive && hoveredPart === part.id ? (
                <Outlines screenspace thickness={0.005} color={accent} toneMapped={false} />
              ) : null}
              {children?.(part.id)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload("/models/forge-runner.glb");
