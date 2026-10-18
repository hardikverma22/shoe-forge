"use client";

import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Preload } from "@react-three/drei";
import { forgeRunner } from "@/lib/products/forge-runner";
import { shownDesign, useLanding } from "@/lib/design/landing-store";
import { rig, type Pose } from "@/lib/three/landing-rig";
import { useSceneMeta } from "@/lib/three/scene-store";
import { computeAnchors } from "@/lib/three/anchors";
import { Stage } from "@/components/three/Stage";
import { ProductModel, type SurfaceEvent } from "@/components/three/ProductModel";

const FOV = 32;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** Camera looks from slightly above, at the shoe's side. */
const VIEW_DIR = new THREE.Vector3(0, 0.4, 1).normalize();
const SHOE_LENGTH = 1.6;
/** Each part's own axis of travel (toe is +x, side is +z) if the pair is ever pulled apart. */
const EXPLODE: Record<string, [number, number, number]> = {
  sole: [0, -0.42, 0],
  upper: [0, 0.02, 0],
  lining: [-0.1, 0.34, -0.02],
  laces: [0.06, 0.5, 0.04],
  toecap: [0.4, 0.06, 0.04],
  stripes: [0, 0.02, 0.34],
  heel: [-0.22, 0.52, 0],
  tongue: [-0.44, 0.06, 0],
};
const POSE_KEYS: (keyof Pose)[] = ["cx", "cy", "size", "yaw", "explode", "spin", "callouts"];

/** Ignore pointer events that began on a DOM control, a drag, or outside the hero. */
const gate = (e: SurfaceEvent) => {
  if (!rig.interactive || rig.dragging || rig.justDragged) return false;
  const target = e.nativeEvent.target as HTMLElement | null;
  return !target?.closest?.("a,button,input,textarea,select,[data-no-pick]");
};

function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const warm = useRef(0);
  const size = useThree((s) => s.size);
  const design = useLanding(shownDesign);
  const layout = useSceneMeta((s) => s.layout);

  // Compile every shader up front and let a few frames draw before the entrance starts.
  useEffect(() => {
    if (!layout) return;
    gl.compile(scene, camera);
    warm.current = 0;
  }, [layout, gl, scene, camera]);
  const spin = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const groups = useRef<Record<string, THREE.Group | null>>({});
  const explode = useRef(rig.current.explode);
  const anchors = useRef<Map<string, THREE.Vector3> | null>(null);
  const swayTime = useRef(0);
  const parallax = useRef(0);

  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      box: new THREE.Box3(),
      corner: new THREE.Vector3(),
      cam: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, rawDt) => {
    // Ready once frames come steadily (shader compiles and texture uploads are done), or after
    // four seconds at most, so a slow device still gets its shoe.
    if (layout && !rig.sceneReady) {
      warm.current = rawDt < 0.05 ? warm.current + 1 : 0;
      if (warm.current > 8 || state.clock.elapsedTime > 4) {
        rig.sceneReady = true;
        window.dispatchEvent(new Event("sf:scene-ready"));
      }
    }
    const dt = Math.min(rawDt, 1 / 20);
    const c = rig.current;
    const t = rig.target;

    // Enter from below when scrolling down into a section after the shoe left through the top.
    if (t.cy > -0.2 && t.cy < 1.2 && c.cy < -0.3 && rig.direction === 1) c.cy = 1.45;

    const k = rig.instant ? 1 : 1 - Math.pow(0.0025, dt);
    for (const key of POSE_KEYS) c[key] += (t[key] - c[key]) * k;

    if (!rig.hold) swayTime.current += dt;
    rig.spinAngle += c.spin * dt;
    if (!rig.dragging)
      rig.dragYaw = Math.abs(rig.dragYaw) < 1e-4 ? 0 : rig.dragYaw * Math.pow(0.35, dt);
    const sway = Math.sin(swayTime.current * 0.42) * 0.2 * (1 - c.explode) * (c.spin > 0 ? 0 : 1);
    if (!rig.hold)
      parallax.current +=
        ((rig.interactive ? rig.pointer.x * 0.1 : 0) - parallax.current) * Math.min(1, dt * 4);

    const g = spin.current;
    // Entrance: the shoe rises from below while turning into its pose.
    const inv = 1 - rig.intro;
    if (g) g.rotation.y = c.yaw + rig.spinAngle + rig.dragYaw + sway + parallax.current + inv * 0.9;
    explode.current = c.explode;

    // Frame the shoe: distance sets its size, the view offset sets where it sits on screen.
    const W = size.width;
    const H = size.height;
    const L = Math.max(40, c.size * Math.min(W, H * 1.6));
    const d = (SHOE_LENGTH * H) / (2 * TAN * L);
    camera.position.copy(VIEW_DIR).multiplyScalar(d);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, (0.5 - c.cx) * W, (0.5 - (c.cy + inv * 0.75)) * H, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // Project part centers and the overall bounds for the DOM callouts.
    if (g && layout) {
      g.updateMatrixWorld(true);
      for (const part of forgeRunner.parts) {
        const pg = groups.current[part.id];
        if (!pg) continue;
        anchors.current ??= computeAnchors(forgeRunner, groups.current);
        const local = anchors.current?.get(part.id);
        if (!local) continue;
        pg.localToWorld(tmp.v.copy(local)).project(camera);
        const a = (rig.anchors[part.id] ??= { x: 0, y: 0 });
        a.x = ((tmp.v.x + 1) / 2) * W;
        a.y = ((1 - tmp.v.y) / 2) * H;
      }
      if (model.current) tmp.box.setFromObject(model.current);
      let left = Infinity,
        right = -Infinity,
        top = Infinity,
        bottom = -Infinity;
      for (let i = 0; i < 8; i++) {
        tmp.corner
          .set(
            i & 1 ? tmp.box.max.x : tmp.box.min.x,
            i & 2 ? tmp.box.max.y : tmp.box.min.y,
            i & 4 ? tmp.box.max.z : tmp.box.min.z,
          )
          .project(camera);
        const x = ((tmp.corner.x + 1) / 2) * W;
        const y = ((1 - tmp.corner.y) / 2) * H;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
      const b = rig.bounds;
      b.left = left;
      b.right = right;
      b.top = top;
      b.bottom = bottom;
      b.cx = c.cx * W;
      b.cy = c.cy * H;
      for (const fn of rig.listeners) fn();
    }
    void state;
  });

  return (
    <>
      <group ref={spin}>
        <group ref={model}>
          <ProductModel
            product={forgeRunner}
            design={design}
            interactive
            gate={gate}
            accent="#D7FF3A"
            explodeRef={explode}
            stagger={0.08}
            explodeOffsets={EXPLODE}
            groupsRef={groups}
          />
        </group>
      </group>
      {/* Shadows live at the scene root, unrotated: drei's ContactShadows misplaces its
        shadow when a parent group turns, so it must not ride inside the spinning shoe. */}
      <group ref={shadow}>
        {/* Like a product photo on a sweep: a dense contact shadow hugging the sole, and a
            faint, slightly wider occlusion. Both stay close to the footprint so the shoe sits
            on the floor instead of hovering over a blob. */}
        <ContactShadows
          position={[0, (layout?.floorY ?? -0.35) - 0.002, 0]}
          opacity={0.85}
          scale={2.1}
          blur={1.1}
          far={0.32}
          resolution={512}
          color="#0b0c12"
        />
        <ContactShadows
          position={[0, (layout?.floorY ?? -0.35) - 0.003, 0]}
          opacity={0.3}
          scale={2.4}
          blur={2.2}
          far={0.8}
          resolution={256}
          color="#0b0c12"
        />
      </group>
    </>
  );
}

/** One fixed, transparent 3D layer for the whole home page. The page's scroll drives the rig. */
export default function LandingScene({
  eventSource,
}: {
  eventSource: RefObject<HTMLElement | null>;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 3.4], fov: FOV, near: 0.05, far: 60 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      // Neutral tone mapping keeps picked colors true (ACES shifts saturated blues toward violet).
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
      }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      onPointerMissed={() => undefined}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Stage stage="studio" shadows={false} />
        <directionalLight position={[-3, 2.5, -3]} intensity={1.4} color="#c9ccff" />
        <Rig />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
