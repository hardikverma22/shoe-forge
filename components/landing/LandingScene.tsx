"use client";

import { useRef, Suspense, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type * as THREE from "three";
import { forgeRunner } from "@/lib/products/forge-runner";
import { defaultDesign } from "@/lib/design/defaults";
import { Stage } from "@/components/three/Stage";
import { ProductModel } from "@/components/three/ProductModel";

const hero = (() => {
  const d = defaultDesign(forgeRunner, "Gum classic");
  const gum = forgeRunner.colorways.find((c) => c.id === "gum-classic");
  if (gum) for (const [id, patch] of Object.entries(gum.parts)) d.parts[id] = { ...d.parts[id]!, ...patch } as typeof d.parts[string];
  return d;
})();

/** Slowly turns its children; scroll adds a little extra rotation through the ref. */
function Turntable({ explodeRef, children }: { explodeRef: MutableRefObject<number>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.getElapsedTime() * 0.25 + explodeRef.current * 0.9;
  });
  return <group ref={group}>{children}</group>;
}

/** Full-bleed 3D shoe for the landing page. Scroll drives explodeRef; the model slowly turns. */
export default function LandingScene({ explodeRef }: { explodeRef: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [1.9, 0.9, 2.9], fov: 40, near: 0.05, far: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      role="img"
      aria-label="A rotating 3D Forge Runner sneaker. It separates into its parts as you scroll."
    >
      <Suspense fallback={null}>
        <Stage stage="studio" />
        <Turntable explodeRef={explodeRef}>
          <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
            <ProductModel product={forgeRunner} design={hero} interactive={false} explodeRef={explodeRef} />
          </Float>
        </Turntable>
      </Suspense>
    </Canvas>
  );
}
