"use client";

import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { MATERIAL_IDS, type MaterialId, type PartConfig } from "@/lib/products/schema";
import { MATERIALS, type MaterialPreset } from "./presets";

export type MaterialMaps = { normal: THREE.Texture; roughness: THREE.Texture };

const texturePaths = MATERIAL_IDS.flatMap((id) => [
  `/textures/${id}/normal.webp`,
  `/textures/${id}/roughness.webp`,
]);
useTexture.preload(texturePaths);

/** Loads every material's normal and roughness maps once. */
export function useMaterialMaps(): Record<MaterialId, MaterialMaps> {
  const textures = useTexture(texturePaths);
  return useMemo(() => {
    const out = {} as Record<MaterialId, MaterialMaps>;
    MATERIAL_IDS.forEach((id, i) => {
      out[id] = { normal: textures[i * 2]!, roughness: textures[i * 2 + 1]! };
    });
    return out;
  }, [textures]);
}

/**
 * Clones of a texture with its own repeat, cached so changing a part back and forth
 * doesn't allocate new GPU textures. Everything is disposed on unmount.
 */
export function useTextureCache() {
  const cache = useRef(new Map<string, THREE.Texture>());
  useEffect(() => {
    const map = cache.current;
    return () => {
      map.forEach((t) => t.dispose());
      map.clear();
    };
  }, []);

  return (key: string, source: THREE.Texture, repeat: number) => {
    const id = `${key}@${repeat.toFixed(2)}`;
    let tex = cache.current.get(id);
    if (!tex) {
      tex = source.clone();
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      cache.current.set(id, tex);
    }
    return tex;
  };
}

/** Writes a material preset plus part overrides onto our own MeshPhysicalMaterial. */
export function applyMaterial(
  mat: THREE.MeshPhysicalMaterial,
  cfg: PartConfig,
  maps: Record<MaterialId, MaterialMaps>,
  cached: ReturnType<typeof useTextureCache>,
  partKey: string,
) {
  const preset: MaterialPreset = MATERIALS[cfg.material];
  const repeat = preset.repeat * (cfg.scale ?? 1);
  const set = maps[cfg.material];

  mat.normalMap = cached(`${partKey}:${cfg.material}:normal`, set.normal, repeat);
  mat.roughnessMap = cached(`${partKey}:${cfg.material}:rough`, set.roughness, repeat);
  mat.normalScale.set(preset.normalScale, preset.normalScale);
  mat.roughness = cfg.roughness ?? preset.roughness;
  mat.metalness = 0;
  mat.sheen = cfg.sheen ?? preset.sheen;
  mat.sheenRoughness = 0.6;
  mat.sheenColor.set("#ffffff");
  mat.clearcoat = preset.clearcoat;
  mat.clearcoatRoughness = preset.clearcoatRoughness;
  mat.needsUpdate = true;
}
