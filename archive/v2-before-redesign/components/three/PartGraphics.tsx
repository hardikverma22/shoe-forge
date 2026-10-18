/* eslint-disable react-hooks/immutability -- R3F: three.js textures are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { Decal, useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import type { Graphic } from "@/lib/design/types";
import { decalOrientation } from "@/lib/graphics/geometry";

/** One graphic projected onto the mesh it's a child of. */
export function GraphicDecal({ graphic, selected, accent }: { graphic: Graphic; selected: boolean; accent: string }) {
  const map = useTexture(graphic.src ?? "/marks/spark.png");
  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
  }, [map]);
  const quaternion = useMemo(() => decalOrientation(graphic.normal, graphic.rotation), [graphic.normal, graphic.rotation]);
  const img = map.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / img.height : 1;
  const s = graphic.scale;

  return (
    <>
      <Decal
        position={graphic.position}
        quaternion={quaternion}
        scale={[s * aspect, s, s]}
      >
        <meshPhysicalMaterial map={map} transparent roughness={0.55} polygonOffset polygonOffsetFactor={-4} depthTest />
      </Decal>
      {selected ? (
        <mesh
          position={[
            graphic.position[0] + graphic.normal[0] * 0.002,
            graphic.position[1] + graphic.normal[1] * 0.002,
            graphic.position[2] + graphic.normal[2] * 0.002,
          ]}
          quaternion={quaternion}
        >
          <ringGeometry args={[s * 0.52, s * 0.56, 48]} />
          <meshBasicMaterial color={accent} depthTest={false} transparent opacity={0.9} />
        </mesh>
      ) : null}
    </>
  );
}
