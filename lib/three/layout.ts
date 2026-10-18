import * as THREE from "three";

export type PartLayout = { id: string; meshName: string };

export type ModelLayout = {
  /** Uniform scale so the shoe's longest side is FIT_SIZE units. */
  scale: number;
  /** Offset that centers the model on the origin (already multiplied by scale). */
  offset: [number, number, number];
  /** Lowest point after layout, used for the contact shadow. */
  floorY: number;
  /** Part centers in normalized space (origin = model center). */
  partCenters: Record<string, [number, number, number]>;
};

export const FIT_SIZE = 1.6;

/** Measures the loaded scene once and returns a centered, normalized layout. */
export function computeLayout(scene: THREE.Object3D, parts: PartLayout[]): ModelLayout {
  scene.updateMatrixWorld(true);
  const overall = new THREE.Box3();
  const boxes: Record<string, THREE.Box3> = {};

  for (const part of parts) {
    const obj = scene.getObjectByName(part.meshName);
    if (!obj) {
      console.warn(`[layout] mesh "${part.meshName}" not found in model`);
      continue;
    }
    const box = new THREE.Box3().setFromObject(obj);
    boxes[part.id] = box;
    overall.union(box);
  }

  const size = overall.getSize(new THREE.Vector3());
  const center = overall.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = FIT_SIZE / maxDim;

  const partCenters: ModelLayout["partCenters"] = {};
  for (const [id, box] of Object.entries(boxes)) {
    const c = box.getCenter(new THREE.Vector3()).sub(center).multiplyScalar(scale);
    partCenters[id] = [c.x, c.y, c.z];
  }

  return {
    scale,
    offset: [-center.x * scale, -center.y * scale, -center.z * scale],
    floorY: (overall.min.y - center.y) * scale,
    partCenters,
  };
}
