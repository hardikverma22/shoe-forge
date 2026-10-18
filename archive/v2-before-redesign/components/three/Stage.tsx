/* eslint-disable react-hooks/immutability -- R3F: three.js objects are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import type { StageId } from "@/lib/design/types";
import { useSceneMeta } from "@/lib/three/scene-store";

/**
 * Lighting presets. The environment is generated locally from three's RoomEnvironment,
 * so the studio never waits on a remote HDRI (works offline, and it can't block rendering).
 */
const PRESET: Record<StageId, { envIntensity: number; key: string; keyIntensity: number; fill: string }> = {
  studio: { envIntensity: 0.9, key: "#ffffff", keyIntensity: 1.1, fill: "#dfe7ff" },
  daylight: { envIntensity: 1.0, key: "#fff4e0", keyIntensity: 1.3, fill: "#e6f3ff" },
  sunset: { envIntensity: 0.8, key: "#ffb27a", keyIntensity: 1.2, fill: "#ffd9b3" },
  night: { envIntensity: 0.45, key: "#9fb4ff", keyIntensity: 0.9, fill: "#5f73c9" },
};

export function Stage({ stage }: { stage: StageId }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const layout = useSceneMeta((s) => s.layout);
  const cfg = PRESET[stage];
  const floorY = layout?.floorY ?? -0.4;

  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);

  useEffect(() => {
    scene.environment = envMap;
    return () => {
      scene.environment = null;
    };
  }, [scene, envMap]);

  useEffect(() => () => envMap.dispose(), [envMap]);

  useEffect(() => {
    scene.environmentIntensity = cfg.envIntensity;
  }, [scene, cfg.envIntensity]);

  return (
    <>
      <directionalLight position={[2.5, 4, 2]} intensity={cfg.keyIntensity} color={cfg.key} />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.45} color={cfg.fill} />
      <ambientLight intensity={0.2} />
      <ContactShadows
        key={stage}
        position={[0, floorY - 0.001, 0]}
        opacity={0.5}
        scale={3}
        blur={2.2}
        far={1.2}
        resolution={512}
        frames={1}
      />
    </>
  );
}
