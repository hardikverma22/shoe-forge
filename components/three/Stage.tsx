"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { StageId } from "@/lib/design/types";
import { useSceneMeta } from "@/lib/three/scene-store";

/**
 * A product-photography light rig, built from softboxes (Lightformers) rendered into the
 * environment map once. Lights are neutral so picked colors stay true; presets only change
 * the balance and warmth. Nothing is fetched from the network.
 */
type Rig = {
  /** Overall environment strength. */
  env: number;
  /** Large overhead softbox. */
  top: number;
  /** Long strip lights on both sides (these draw the highlights that show finish). */
  strips: number;
  /** Rim light behind the shoe. */
  rim: number;
  /** Low bounce from the front, lifts the shadows. */
  bounce: number;
  /** Warmth of the key light. */
  key: string;
  /** Directional key for definition. */
  keyIntensity: number;
  /** Color of the dark studio around the softboxes (seen only in reflections). */
  room: string;
};

const PRESET: Record<StageId, Rig> = {
  studio: {
    env: 1,
    top: 2.2,
    strips: 3,
    rim: 2,
    bounce: 0.6,
    key: "#ffffff",
    keyIntensity: 0.9,
    room: "#2b2b2e",
  },
  daylight: {
    env: 1.1,
    top: 3,
    strips: 2,
    rim: 1.2,
    bounce: 0.9,
    key: "#fff6ea",
    keyIntensity: 1.1,
    room: "#4a5058",
  },
  sunset: {
    env: 0.95,
    top: 1.4,
    strips: 2.6,
    rim: 3,
    bounce: 0.5,
    key: "#ffd2a8",
    keyIntensity: 1,
    room: "#3a2a24",
  },
  night: {
    env: 0.7,
    top: 0.9,
    strips: 3.4,
    rim: 3.2,
    bounce: 0.25,
    key: "#dfe6ff",
    keyIntensity: 0.6,
    room: "#121318",
  },
};

export function Stage({ stage, shadows = true }: { stage: StageId; shadows?: boolean }) {
  const layout = useSceneMeta((s) => s.layout);
  const cfg = PRESET[stage];
  const floorY = layout?.floorY ?? -0.4;

  return (
    <>
      <Environment key={`env-${stage}`} resolution={256} frames={1} environmentIntensity={cfg.env}>
        <color attach="background" args={[cfg.room]} />
        <Lightformer
          form="rect"
          intensity={cfg.top}
          color={cfg.key}
          position={[0, 5, 0.5]}
          rotation-x={Math.PI / 2}
          scale={[6, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cfg.strips}
          position={[-4.5, 1.2, 1.5]}
          rotation-y={Math.PI / 2.4}
          scale={[0.6, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cfg.strips * 0.8}
          position={[4.5, 1.2, -1]}
          rotation-y={-Math.PI / 2.2}
          scale={[0.6, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cfg.strips * 0.6}
          position={[0, 1.4, 5]}
          scale={[5, 0.4, 1]}
        />
        <Lightformer form="ring" intensity={cfg.rim} position={[-1, 2, -5]} scale={3} />
        <Lightformer
          form="rect"
          intensity={cfg.bounce}
          position={[0, -2.5, 3]}
          rotation-x={-Math.PI / 3}
          scale={[8, 2, 1]}
        />
      </Environment>
      <directionalLight position={[2.5, 4, 3]} intensity={cfg.keyIntensity} color={cfg.key} />
      {shadows ? (
        <group key={`shadow-${stage}`}>
          {/* A tight contact shadow where the sole meets the floor, plus a wide, faint one. */}
          <ContactShadows
            position={[0, floorY - 0.001, 0]}
            opacity={0.75}
            scale={2.6}
            blur={1.4}
            far={0.18}
            resolution={1024}
            frames={1}
            color="#0b0c12"
          />
          <ContactShadows
            position={[0, floorY - 0.002, 0]}
            opacity={0.25}
            scale={3.6}
            blur={3.2}
            far={0.9}
            resolution={512}
            frames={1}
            color="#0b0c12"
          />
        </group>
      ) : null}
    </>
  );
}
