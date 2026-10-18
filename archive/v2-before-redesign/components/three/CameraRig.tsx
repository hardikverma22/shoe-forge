"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import gsap from "gsap";
import type { ProductDef } from "@/lib/products/schema";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";
import * as THREE from "three";

type Vec = [number, number, number];

/** Orbit controls plus GSAP camera moves to views and parts. */
export function CameraRig({ product, enabled = true }: { product: ProductDef; enabled?: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const view = useStudioUI((s) => s.view);
  const selected = useStudioUI((s) => s.selectedPart);
  const autoRotate = useStudioUI((s) => s.autoRotate);
  const nonce = useStudioUI((s) => s.cameraNonce);
  const layout = useSceneMeta((s) => s.layout);
  const dragging = useStudioUI((s) => s.dragging);

  const flyTo = (position: Vec, target: Vec) => {
    const c = controls.current;
    if (!c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 0.9;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(c.target);
    gsap.to(camera.position, { x: position[0], y: position[1], z: position[2], duration, ease: "power3.inOut", onUpdate: () => c.update() });
    gsap.to(c.target, { x: target[0], y: target[1], z: target[2], duration, ease: "power3.inOut", onUpdate: () => c.update() });
  };

  useEffect(() => {
    if (!view) return;
    const v = product.cameraViews.find((x) => x.id === view);
    if (v) flyTo(v.position, [0, 0, 0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce]);

  useEffect(() => {
    if (!selected || !layout) return;
    const c = layout.partCenters[selected];
    if (!c) return;
    // Look at the part from the outside, along the direction from the model's center.
    const dir = new THREE.Vector3(...c).normalize();
    if (dir.lengthSq() === 0) dir.set(0, 0.3, 1);
    const distance = 1.05;
    const pos = new THREE.Vector3(...c).add(dir.multiplyScalar(distance)).add(new THREE.Vector3(0, 0.25, 0));
    flyTo([pos.x, pos.y, pos.z], c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, layout]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const kill = () => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(c.target);
    };
    c.addEventListener("start", kill);
    return () => c.removeEventListener("start", kill);
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled && !dragging}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.4}
      maxDistance={4.5}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      autoRotate={autoRotate}
      autoRotateSpeed={1.2}
    />
  );
}
