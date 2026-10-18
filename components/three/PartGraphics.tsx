/* eslint-disable react-hooks/immutability -- R3F: three.js textures are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { DecalGeometry } from "three-stdlib";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Graphic } from "@/lib/design/types";
import { decalOrientation } from "@/lib/graphics/geometry";

/**
 * One graphic projected onto the part mesh it is a child of. Position and normal are in the
 * part's (model) space; the projector box faces along the surface normal, so the print wraps
 * the surface instead of floating on a flat card.
 */
export function GraphicDecal({
  graphic,
  selected,
  accent,
}: {
  graphic: Graphic;
  selected: boolean;
  accent: string;
}) {
  const map = useTexture(graphic.src ?? "/marks/spark.png");
  const anchor = useRef<THREE.Group>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
  }, [map]);

  const img = map.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 1;
  const s = graphic.scale;
  const quaternion = useMemo(
    () => decalOrientation(graphic.normal, graphic.rotation),
    [graphic.normal, graphic.rotation],
  );

  useLayoutEffect(() => {
    const parent = anchor.current?.parent;
    if (!(parent instanceof THREE.Mesh)) return;
    // Project in the mesh's own space: identity world matrix while building.
    const saved = parent.matrixWorld.clone();
    parent.matrixWorld.identity();
    const position = new THREE.Vector3(...graphic.position);
    const orientation = new THREE.Euler().setFromQuaternion(quaternion);
    const g = new DecalGeometry(
      parent,
      position,
      orientation,
      new THREE.Vector3(s * aspect, s, s * 0.9),
    );
    parent.matrixWorld.copy(saved);
    setGeometry(g);
    return () => g.dispose();
  }, [graphic.position, quaternion, s, aspect]);

  const n = graphic.normal;
  const lift = 0.002;

  return (
    <group ref={anchor}>
      {geometry ? (
        <mesh geometry={geometry} renderOrder={2}>
          <meshPhysicalMaterial
            map={map}
            color={graphic.kind === "mark" ? (graphic.color ?? "#0a0a12") : "#ffffff"}
            transparent
            alphaTest={0.02}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-6}
            roughness={0.5}
            clearcoat={0.2}
          />
        </mesh>
      ) : null}
      {selected ? (
        <mesh
          position={[
            graphic.position[0] + n[0] * lift,
            graphic.position[1] + n[1] * lift,
            graphic.position[2] + n[2] * lift,
          ]}
          quaternion={quaternion}
          renderOrder={3}
        >
          <ringGeometry
            args={[Math.max(s * aspect, s) * 0.58, Math.max(s * aspect, s) * 0.61, 64]}
          />
          <meshBasicMaterial
            color={accent}
            depthTest={false}
            transparent
            opacity={0.95}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}
