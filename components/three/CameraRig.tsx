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
  const focusNonce = useStudioUI((s) => s.focusNonce);
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
    gsap.to(camera.position, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration,
      ease: "power3.inOut",
      onUpdate: () => c.update(),
    });
    gsap.to(c.target, {
      x: target[0],
      y: target[1],
      z: target[2],
      duration,
      ease: "power3.inOut",
      onUpdate: () => c.update(),
    });
  };

  useEffect(() => {
    if (!view) return;
    const v = product.cameraViews.find((x) => x.id === view);
    if (v) flyTo(v.position, [0, 0, 0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, nonce]);

  useEffect(() => {
    const selected = useStudioUI.getState().selectedPart;
    if (!focusNonce || !selected || !layout) return;
    const c = layout.partCenters[selected];
    if (!c) return;
    // Swing toward the part's side, blended with the current angle so the move stays short,
    // and stay far enough back that the whole shoe remains in frame.
    const toPart = new THREE.Vector3(...c);
    if (toPart.lengthSq() < 1e-4) toPart.set(0, 0.3, 1);
    const current = camera.position
      .clone()
      .sub(controls.current?.target ?? new THREE.Vector3())
      .normalize();
    const dir = toPart
      .normalize()
      .multiplyScalar(0.55)
      .add(current.multiplyScalar(0.45))
      .normalize();
    dir.y = Math.max(dir.y, 0.12);
    const pos = dir.normalize().multiplyScalar(2.6);
    // Keep the shoe centered; only bias the target a little toward the part.
    flyTo([pos.x, pos.y, pos.z], [c[0] * 0.35, c[1] * 0.35, c[2] * 0.35]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce, layout]);

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
      minDistance={1.3}
      maxDistance={4.8}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      autoRotate={autoRotate}
      autoRotateSpeed={1.2}
    />
  );
}
