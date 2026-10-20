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
    const preset = product.cameraViews.find((v) => v.id === product.parts.find((p) => p.id === selected)?.view);
    if (preset) {
      flyTo(preset.position, [0, 0, 0]);
      return;
    }
    const c = layout.partCenters[selected];
    if (!c) return;
    const current = camera.position
      .clone()
      .sub(controls.current?.target ?? new THREE.Vector3())
      .normalize();
    const f = useSceneMeta.getState().facings?.[selected];
    const facing = f ? new THREE.Vector3(...f) : null;
    if (facing && facing.length() > 0.3) {
      // A part that faces one way (a sole, the laces, a heel patch) is seen from that side, even
      // from underneath, with a little of the current angle kept so the move feels continuous.
      // Only a part that clearly faces the floor (a sole, a tread) is worth looking at from below;
      // a sidewall that also wraps a little underneath is seen from above.
      const fromBelow = facing.y < -0.5;
      const dir = facing.normalize().multiplyScalar(0.8).add(current.multiplyScalar(0.2)).normalize();
      if (!fromBelow) dir.y = Math.max(dir.y, 0.12);
      const pos = dir.normalize().multiplyScalar(2.6);
      flyTo([pos.x, pos.y, pos.z], [c[0] * 0.25, c[1] * 0.25, c[2] * 0.25]);
      return;
    }
    // A part that wraps around the shoe (an upper, both quarters) has no best side: keep the
    // current angle and just settle at a comfortable three-quarter height, centered.
    // Looking straight at the toe or heel shows little of such a part, so ease out to three-quarters.
    let az = Math.atan2(current.z, current.x);
    if (Math.abs(Math.sin(az)) < 0.55) az = Math.sign(Math.cos(az) || 1) > 0 ? Math.sign(az || 1) * 0.85 : Math.sign(az || 1) * (Math.PI - 0.85);
    const y = Math.min(0.5, Math.max(0.18, current.y));
    const r = Math.sqrt(1 - y * y);
    const pos = new THREE.Vector3(Math.cos(az) * r, y, Math.sin(az) * r).multiplyScalar(2.6);
    flyTo([pos.x, pos.y, pos.z], [0, 0, 0]);
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
