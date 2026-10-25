/* eslint-disable react-hooks/immutability -- R3F: three.js objects are mutated imperatively, as the R3F docs describe. */
"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { useStudioUI } from "@/lib/design/ui-store";
import { MATERIALS } from "@/lib/materials/presets";
import { FIT_SIZE } from "@/lib/three/layout";
import { useSceneMeta } from "@/lib/three/scene-store";
import { partFacing } from "@/lib/three/facing";
import type { SurfaceEvent, SurfaceKind } from "./ProductModel";

/**
 * A textured shoe (often a photo scan) whose parts are recolored in place. Each part is either a
 * whole material or one color region of it (a channel of a mask texture). The shader swaps the
 * region's color but keeps the texture's own shading, stitching and grain; an untouched part
 * renders exactly as the original.
 */

const SLOTS = 9;
/** Regions per mask texture: RGB only (alpha would be premultiplied away by the browser). */
const PER_MASK = 3;
const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, "_");
const linear = (hex: string) => new THREE.Color(hex);

type Slot = { partId: string; index: number };
type MatEntry = {
  name: string;
  material: THREE.MeshPhysicalMaterial;
  /** Whether this material is split into regions by mask textures. */
  masked: boolean;
  slots: Slot[];
  uniforms: {
    uTarget: { value: THREE.Vector3[] };
    uOn: { value: number[] };
    uRough: { value: number[] };
    uRoughOn: { value: number[] };
    uGlow: { value: number[] };
    /** Per-region finish: clearcoat for patent, a colored sheen for suede and knit. */
    uCoat: { value: number[] };
    uCoatRough: { value: number[] };
    uSheen: { value: THREE.Vector3[] };
    uSheenRough: { value: number[] };
  };
  /** CPU copies of the masks for picking and anchors (256x256 RGBA). */
  maskPixels: Uint8ClampedArray[];
  /** The original look of each slot (linear RGB), what "untouched" means. */
  means: THREE.Vector3[];
  base: { roughness: number; clearcoat: number; sheen: number };
};
type MeshEntry = { name: string; materialName: string; geometry: THREE.BufferGeometry };

const MASK_SIZE = 256;
const WHITE = new THREE.Color(1, 1, 1);

function readPixels(image: CanvasImageSource): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = c.height = MASK_SIZE;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, MASK_SIZE, MASK_SIZE);
  return ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
}

/** Weight of slot `index` at a UV, from the CPU masks (texture v points down). */
function weightAt(entry: MatEntry, u: number, v: number, index: number): number {
  if (!entry.masked) return index === 0 ? 1 : 0;
  const px = entry.maskPixels[Math.floor(index / PER_MASK)];
  if (!px) return 0;
  const x = Math.min(MASK_SIZE - 1, Math.max(0, Math.floor((u - Math.floor(u)) * MASK_SIZE)));
  const y = Math.min(MASK_SIZE - 1, Math.max(0, Math.floor((v - Math.floor(v)) * MASK_SIZE)));
  return px[(y * MASK_SIZE + x) * 4 + (index % PER_MASK)]! / 255;
}

/** Average color of a texture image, in linear RGB. */
function averageColor(image: CanvasImageSource): THREE.Vector3 {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, 0, 0, 16, 16);
  const d = ctx.getImageData(0, 0, 16, 16).data;
  const col = new THREE.Color();
  const sum = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3]! < 10) continue;
    col.setRGB(d[i]! / 255, d[i + 1]! / 255, d[i + 2]! / 255, THREE.SRGBColorSpace);
    sum.add(new THREE.Vector3(col.r, col.g, col.b));
    n++;
  }
  return n ? sum.divideScalar(n) : new THREE.Vector3(0.5, 0.5, 0.5);
}

function floatAttribute(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
  const out = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++) for (let c = 0; c < attr.itemSize; c++) out[i * attr.itemSize + c] = attr.getComponent(i, c);
  return new THREE.BufferAttribute(out, attr.itemSize);
}

function installShader(material: THREE.MeshPhysicalMaterial, entry: MatEntry, masks: THREE.Texture[]) {
  // Without masks the whole material is slot 0.
  const solid = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
  const none = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  solid.needsUpdate = none.needsUpdate = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMask0 = { value: masks[0] ?? solid };
    shader.uniforms.uMask1 = { value: masks[1] ?? none };
    shader.uniforms.uMask2 = { value: masks[2] ?? none };
    shader.uniforms.uMean = { value: entry.means };
    Object.assign(shader.uniforms, entry.uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        /* glsl */ `
uniform sampler2D uMask0;
uniform sampler2D uMask1;
uniform sampler2D uMask2;
uniform vec3 uMean[${SLOTS}];
uniform vec3 uTarget[${SLOTS}];
uniform float uOn[${SLOTS}];
uniform float uRough[${SLOTS}];
uniform float uRoughOn[${SLOTS}];
uniform float uCoat[${SLOTS}];
uniform float uCoatRough[${SLOTS}];
uniform vec3 uSheen[${SLOTS}];
uniform float uSheenRough[${SLOTS}];
uniform float uGlow[${SLOTS}];
void main() {`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
#ifdef USE_MAP
  vec2 sfUv = vMapUv;
#else
  vec2 sfUv = vec2(0.5);
#endif
  vec3 sfA = texture2D(uMask0, sfUv).rgb;
  vec3 sfB = texture2D(uMask1, sfUv).rgb;
  vec3 sfC = texture2D(uMask2, sfUv).rgb;
  float sfW[${SLOTS}];
  sfW[0] = sfA.r; sfW[1] = sfA.g; sfW[2] = sfA.b;
  sfW[3] = sfB.r; sfW[4] = sfB.g; sfW[5] = sfB.b;
  sfW[6] = sfC.r; sfW[7] = sfC.g; sfW[8] = sfC.b;
  vec3 sfBase = diffuseColor.rgb;
  float sfL = dot(sfBase, vec3(0.2126, 0.7152, 0.0722));
  // How much of this texel belongs to a recolored region. Where it is any, the untouched regions
  // that share the texel (soft mask edges) show their own mean color too, not the raw texture,
  // or the original hue leaks out as a line along every border (green welts on a navy Gazelle).
  float sfOnW = 0.0;
  float sfSum = 0.0;
  for (int i = 0; i < ${SLOTS}; i++) {
    sfSum += sfW[i];
    if (uOn[i] > 0.5) sfOnW += sfW[i];
  }
  float sfTouch = smoothstep(0.0, 0.08, sfOnW);
  // Weighted average of the regions; texels outside every mapped region keep the texture.
  vec3 sfOut = sfBase * max(0.0, 1.0 - sfSum);
  for (int i = 0; i < ${SLOTS}; i++) {
    if (sfW[i] > 0.002) {
      bool on = uOn[i] > 0.5;
      if (!on && sfTouch == 0.0) {
        sfOut += sfBase * sfW[i];
        continue;
      }
      float lm = max(dot(uMean[i], vec3(0.2126, 0.7152, 0.0722)), 0.0001);
      // Bright sources keep their shading by ratio; dark ones (black suede) keep it by difference.
      float ratio = clamp(sfL / lm, 0.2, 2.4);
      float detail = clamp(1.0 + (sfL - lm) / max(lm, 0.18) * 0.85, 0.3, 1.8);
      vec3 rc = (on ? uTarget[i] : uMean[i]) * mix(detail, ratio, smoothstep(0.05, 0.28, lm));
      sfOut += (on ? rc : mix(sfBase, rc, sfTouch)) * sfW[i];
    }
  }
  diffuseColor.rgb = sfOut / max(sfSum, 1.0);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
  for (int i = 0; i < ${SLOTS}; i++) {
    if (uRoughOn[i] > 0.5) roughnessFactor = mix(roughnessFactor, uRough[i], sfW[i]);
  }`,
      )
      .replace(
        "#include <normal_fragment_begin>",
        /* glsl */ `#include <normal_fragment_begin>
  // Some CG models store normals opposite to their triangle winding, so the double-sided flip
  // turns them away from the camera and the visible side is lit from behind (gray whites,
  // streaky gloss). Turn any normal that clearly faces away back toward the viewer; the
  // silhouette edges of closed meshes are left alone.
  if (dot(normal, normalize(vViewPosition)) < -0.1) {
    normal = -normal;
    nonPerturbedNormal = -nonPerturbedNormal;
  }`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        /* glsl */ `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  for (int i = 0; i < ${SLOTS}; i++) {
    if (uRoughOn[i] > 0.5) {
      material.clearcoat = mix(material.clearcoat, uCoat[i], sfW[i]);
      material.clearcoatRoughness = mix(material.clearcoatRoughness, max(uCoatRough[i], 0.0525), sfW[i]);
    }
  }
#endif
#ifdef USE_SHEEN
  for (int i = 0; i < ${SLOTS}; i++) {
    if (uRoughOn[i] > 0.5) {
      material.sheenColor = mix(material.sheenColor, uSheen[i], sfW[i]);
      material.sheenRoughness = mix(material.sheenRoughness, uSheenRough[i], sfW[i]);
    }
  }
#endif`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
  float sfGlow = 0.0;
  for (int i = 0; i < ${SLOTS}; i++) sfGlow += uGlow[i] * sfW[i];
  totalEmissiveRadiance += vec3(sfGlow * 0.22);`,
      );
  };
  material.customProgramCacheKey = () => "sf-tint";
  material.needsUpdate = true;
}

type Props = {
  product: ProductDef;
  design: Design;
  accent?: string;
  interactive?: boolean;
  gate?: (e: SurfaceEvent) => boolean;
  /** Graphics rendered inside each mesh, keyed by mesh name. */
  children?: (meshName: string) => ReactNode;
  onSurface?: (kind: SurfaceKind, partId: string, e: SurfaceEvent) => void;
};

export function TintModel({ product, design, interactive = true, gate, children, onSurface }: Props) {
  const gltf = useGLTF(product.modelUrl);
  const clock = useThree((s) => s.clock);

  // Which masks to load: one or two per material that has region parts.
  const maskPlan = useMemo(() => {
    const plan: { material: string; urls: string[] }[] = [];
    const base = product.modelUrl.replace(/\.glb$/, "");
    const byMat = new Map<string, number>();
    for (const p of product.parts) {
      if (p.source?.region === undefined) continue;
      byMat.set(p.source.material, Math.max(byMat.get(p.source.material) ?? 0, p.source.region));
    }
    for (const [material, maxRegion] of byMat) {
      const dir = `${base}/${safe(material)}`;
      plan.push({ material, urls: Array.from({ length: Math.floor(maxRegion / PER_MASK) + 1 }, (_, i) => `${dir}/mask-${i}.png`) });
    }
    return plan;
  }, [product]);
  const maskUrls = useMemo(() => (maskPlan.length ? maskPlan.flatMap((p) => p.urls) : ["/marks/spark.png"]), [maskPlan]);
  const maskTextures = useTexture(maskUrls);

  // Geometry in model space: source transforms, the product's orientation, then fit and center.
  const { meshes, floorY } = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const o = product.orientation;
    const orient = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(o.x), THREE.MathUtils.degToRad(o.y), THREE.MathUtils.degToRad(o.z)));
    const list: MeshEntry[] = [];
    const box = new THREE.Box3();
    gltf.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.isMesh || !m.visible) return;
      const g = new THREE.BufferGeometry();
      for (const [name, attr] of Object.entries(m.geometry.attributes)) g.setAttribute(name, floatAttribute(attr));
      if (m.geometry.index) g.setIndex(m.geometry.index.clone());
      g.applyMatrix4(orient.clone().multiply(m.matrixWorld));
      g.computeBoundingBox();
      box.union(g.boundingBox!);
      const mat = Array.isArray(m.material) ? m.material[0]! : m.material;
      list.push({ name: m.name, materialName: mat.name, geometry: g });
    });
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = FIT_SIZE / (Math.max(size.x, size.y, size.z) || 1);
    const fit = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    for (const e of list) {
      e.geometry.applyMatrix4(fit);
      e.geometry.computeBoundingBox();
      e.geometry.computeBoundingSphere();
      if (!e.geometry.getAttribute("normal")) e.geometry.computeVertexNormals();
    }
    return { meshes: list, floorY: (box.min.y - center.y) * scale };
  }, [gltf.scene, product.orientation]);
  useEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes]);

  // One tinting material per source material, cloned so the cached glTF is never mutated.
  const entries = useMemo(() => {
    const out = new Map<string, MatEntry>();
    const sources = new Map<string, THREE.Material>();
    gltf.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh) {
        const mat = Array.isArray(m.material) ? m.material[0]! : m.material;
        sources.set(mat.name, mat);
      }
    });
    let maskCursor = 0;
    const maskFor = new Map<string, THREE.Texture[]>();
    for (const p of maskPlan) {
      maskFor.set(p.material, maskTextures.slice(maskCursor, maskCursor + p.urls.length));
      maskCursor += p.urls.length;
    }
    for (const [name, src] of sources) {
      const std = src as THREE.MeshStandardMaterial;
      const material = new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(material, std);
      material.side = THREE.DoubleSide;
      const masks = maskFor.get(name) ?? [];
      for (const t of masks) {
        t.colorSpace = THREE.NoColorSpace;
        t.flipY = false;
        t.needsUpdate = true;
      }
      const slots: Slot[] = product.parts
        .filter((p) => p.source?.material === name)
        .map((p) => ({ partId: p.id, index: p.source!.region ?? 0 }));
      const means = Array.from({ length: SLOTS }, () => new THREE.Vector3(0.5, 0.5, 0.5));
      // Whole-material parts: the material's own look is "untouched".
      const whole = slots.find((s) => product.parts.find((p) => p.id === s.partId)?.source?.region === undefined);
      if (whole) {
        const c = std.color ?? new THREE.Color(1, 1, 1);
        const img = std.map?.image as CanvasImageSource | undefined;
        const avg = img ? averageColor(img) : new THREE.Vector3(1, 1, 1);
        means[0]!.set(avg.x * c.r, avg.y * c.g, avg.z * c.b);
      }
      for (const s of slots) {
        const part = product.parts.find((p) => p.id === s.partId)!;
        if (part.source?.region !== undefined) {
          const m = linear(part.source.color ?? part.default.color);
          const c = std.color ?? new THREE.Color(1, 1, 1);
          means[s.index]!.set(m.r * c.r, m.g * c.g, m.b * c.b);
        }
      }
      const entry: MatEntry = {
        name,
        material,
        masked: masks.length > 0,
        slots,
        uniforms: {
          uTarget: { value: means.map((v) => v.clone()) },
          uOn: { value: new Array(SLOTS).fill(0) },
          uRough: { value: new Array(SLOTS).fill(0.5) },
          uRoughOn: { value: new Array(SLOTS).fill(0) },
          uGlow: { value: new Array(SLOTS).fill(0) },
          uCoat: { value: new Array(SLOTS).fill(0) },
          uCoatRough: { value: new Array(SLOTS).fill(0.3) },
          uSheen: { value: Array.from({ length: SLOTS }, () => new THREE.Vector3()) },
          uSheenRough: { value: new Array(SLOTS).fill(0.5) },
        },
        maskPixels: masks.map((t) => readPixels(t.image as CanvasImageSource)),
        means,
        base: { roughness: std.roughness ?? 1, clearcoat: 0, sheen: 0 },
      };
      // Regions get clearcoat and sheen per pixel in the shader; a hair of each switches the
      // material's clearcoat and sheen code on without changing the untouched look.
      if (masks.length) {
        material.clearcoat = 1e-4;
        material.sheen = 1e-4;
      }
      installShader(material, entry, masks);
      out.set(name, entry);
    }
    return out;
  }, [gltf.scene, product, maskPlan, maskTextures]);
  useEffect(() => () => entries.forEach((e) => e.material.dispose()), [entries]);

  // Anchors: for each part, the surface vertex nearest the centroid of its region.
  const anchors = useMemo(() => {
    const out: Record<string, [number, number, number]> = {};
    for (const part of product.parts) {
      const src = part.source;
      if (!src) continue;
      const entry = entries.get(src.material);
      if (!entry) continue;
      const pts: THREE.Vector3[] = [];
      for (const m of meshes) {
        if (m.materialName !== src.material) continue;
        const pos = m.geometry.getAttribute("position");
        const uv = m.geometry.getAttribute("uv");
        const step = Math.max(1, Math.floor(pos.count / 4000));
        for (let i = 0; i < pos.count; i += step) {
          const w = src.region === undefined || !uv ? 1 : weightAt(entry, uv.getX(i), uv.getY(i), src.region);
          if (w > 0.6) pts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
      }
      if (!pts.length) continue;
      const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length);
      let best = pts[0]!;
      let bd = Infinity;
      for (const p of pts) {
        const d = p.distanceToSquared(c);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      out[part.id] = [best.x, best.y, best.z];
    }
    return out;
  }, [product.parts, entries, meshes]);

  // Which way each part faces, so picking the outsole turns the camera underneath.
  const facings = useMemo(() => {
    const out: Record<string, [number, number, number]> = {};
    const center = new THREE.Vector3();
    for (const part of product.parts) {
      const src = part.source;
      const entry = src && entries.get(src.material);
      if (!src || !entry) continue;
      const geos = meshes.filter((m) => m.materialName === src.material).map((m) => m.geometry);
      const weight =
        src.region === undefined
          ? undefined
          : (g: THREE.BufferGeometry, i: number) => {
              const uv = g.getAttribute("uv");
              return uv ? weightAt(entry, uv.getX(i), uv.getY(i), src.region!) : 0;
            };
      out[part.id] = partFacing(geos, center, weight).toArray();
    }
    return out;
  }, [product.parts, entries, meshes]);

  const rootRef = useRef<THREE.Group>(null);
  useEffect(() => {
    useSceneMeta.getState().setRoot(rootRef.current);
  }, []);
  useEffect(() => {
    useSceneMeta.getState().setAnchors(anchors);
    useSceneMeta.getState().setLayout({ scale: 1, offset: [0, 0, 0], floorY, partCenters: anchors });
    useSceneMeta.getState().setFacings(facings);
    return () => {
      useSceneMeta.getState().setAnchors(null);
      useSceneMeta.getState().setFacings(null);
    };
  }, [anchors, floorY, facings]);

  // Selection pulse.
  const pulses = useRef<Record<string, number>>({});
  const selectedPart = useStudioUI((s) => s.selectedPart);
  useEffect(() => {
    if (selectedPart) pulses.current[selectedPart] = clock.elapsedTime;
  }, [selectedPart, clock]);

  const target = useMemo(() => new THREE.Vector3(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  useFrame((state, dt) => {
    const k = 1 - Math.pow(0.002, dt);
    const ui = useStudioUI.getState();
    for (const entry of entries.values()) {
      for (const slot of entry.slots) {
        const part = product.parts.find((p) => p.id === slot.partId)!;
        const cfg = design.parts[part.id];
        if (!cfg) continue;
        // "Untouched" means the model's own color, which a painted default may differ from.
        const changedColor = cfg.color.toUpperCase() !== (part.source?.color ?? part.default.color).toUpperCase();
        const i = slot.index;
        const cur = entry.uniforms.uTarget.value[i]!;
        if (changedColor) {
          tmpColor.set(cfg.color);
          target.set(tmpColor.r, tmpColor.g, tmpColor.b);
          entry.uniforms.uOn.value[i] = 1;
        } else target.copy(entry.means[i]!);
        cur.lerp(target, k);
        // Fade back to the original, then stop recoloring so it is exactly the source again.
        if (!changedColor && cur.distanceToSquared(entry.means[i]!) < 1e-6) entry.uniforms.uOn.value[i] = 0;

        const finishChanged = cfg.material !== part.default.material || cfg.roughness !== undefined;
        const preset = MATERIALS[cfg.material];
        if (part.source?.region !== undefined) {
          entry.uniforms.uRoughOn.value[i] = finishChanged ? 1 : 0;
          entry.uniforms.uRough.value[i] = cfg.roughness ?? preset.roughness;
          entry.uniforms.uCoat.value[i] = preset.clearcoat;
          entry.uniforms.uCoatRough.value[i] = preset.clearcoatRoughness;
          entry.uniforms.uSheenRough.value[i] = preset.sheenRoughness;
          tmpColor.set(cfg.color).lerp(WHITE, preset.sheenLift).multiplyScalar(cfg.sheen ?? preset.sheen);
          entry.uniforms.uSheen.value[i]!.set(tmpColor.r, tmpColor.g, tmpColor.b);
        } else {
          entry.material.roughness = finishChanged ? (cfg.roughness ?? preset.roughness) : entry.base.roughness;
          entry.material.clearcoat = finishChanged ? preset.clearcoat : 0;
          entry.material.clearcoatRoughness = preset.clearcoatRoughness;
          entry.material.sheen = finishChanged ? (cfg.sheen ?? preset.sheen) : 0;
          entry.material.sheenRoughness = preset.sheenRoughness;
          entry.material.sheenColor.set(cfg.color).lerp(WHITE, preset.sheenLift);
        }

        const since = state.clock.elapsedTime - (pulses.current[part.id] ?? -10);
        const pulse = interactive && since < 0.7 ? Math.pow(1 - since / 0.7, 2) * 1.4 : 0;
        const hover = interactive && ui.hoveredPart === part.id ? 0.55 : 0;
        entry.uniforms.uGlow.value[i] = Math.max(pulse, hover);
      }
    }
  });

  const allowed = (e: SurfaceEvent) => interactive && (!gate || gate(e));

  /** The part under a pointer hit: a whole-material part, or the strongest region at the UV. */
  const partAt = (e: SurfaceEvent, materialName: string): string | null => {
    const entry = entries.get(materialName);
    if (!entry || !entry.slots.length) return null;
    if (!entry.masked) return entry.slots[0]!.partId;
    const uv = e.uv;
    if (!uv) return null;
    let best: string | null = null;
    let bw = 0.35;
    for (const s of entry.slots) {
      const w = weightAt(entry, uv.x, uv.y, s.index);
      if (w > bw) {
        bw = w;
        best = s.partId;
      }
    }
    return best;
  };

  const setHover = (id: string | null) => {
    if (!interactive) return;
    if (useStudioUI.getState().hoveredPart !== id) useStudioUI.getState().set({ hoveredPart: id });
    if (typeof document !== "undefined") document.body.style.cursor = id ? "pointer" : "";
  };

  return (
    <group ref={rootRef}>
      {meshes.map((m) => {
        const entry = entries.get(m.materialName);
        if (!entry) return null;
        return (
          <mesh
            key={m.name}
            name={m.name}
            geometry={m.geometry}
            material={entry.material}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
              if (!allowed(e)) return;
              e.stopPropagation();
              const id = partAt(e, m.materialName);
              setHover(id);
              if (id && onSurface) onSurface("move", id, e);
            }}
            onPointerOut={() => setHover(null)}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              if (!onSurface || !allowed(e)) return;
              const id = partAt(e, m.materialName);
              if (!id) return;
              e.stopPropagation();
              onSurface("down", id, e);
            }}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
              if (!onSurface || !allowed(e)) return;
              const id = partAt(e, m.materialName);
              if (id) onSurface("up", id, e);
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (!allowed(e)) return;
              const id = partAt(e, m.materialName);
              if (!id) return;
              e.stopPropagation();
              useStudioUI.getState().set({ selectedPart: id });
              onSurface?.("click", id, e);
            }}
          >
            {children?.(m.name)}
          </mesh>
        );
      })}
    </group>
  );
}
