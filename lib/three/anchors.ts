import * as THREE from "three";
import type { ProductDef } from "@/lib/products/schema";

/**
 * For each part, the vertex furthest along the part's `anchor` direction, in the part group's
 * local space (so explode offsets carry it along). Parts without a hint use their center.
 */
export function computeAnchors(
  product: ProductDef,
  groups: Record<string, THREE.Group | null>,
): Map<string, THREE.Vector3> | null {
  const out = new Map<string, THREE.Vector3>();
  const v = new THREE.Vector3();
  for (const part of product.parts) {
    const g = groups[part.id];
    const mesh = g?.children.find((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh);
    const pos = mesh?.geometry.getAttribute("position");
    if (!mesh || !pos) return null;
    mesh.updateMatrix();
    const box = new THREE.Box3();
    for (let i = 0; i < pos.count; i++)
      box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrix));
    const center = box.getCenter(new THREE.Vector3());
    if (!part.anchor) {
      out.set(part.id, center);
      continue;
    }
    const dir = new THREE.Vector3(...part.anchor).normalize();
    let best = -Infinity;
    const pick = center.clone();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrix);
      const d = (v.x - center.x) * dir.x + (v.y - center.y) * dir.y + (v.z - center.z) * dir.z;
      if (d > best) {
        best = d;
        pick.copy(v);
      }
    }
    // Pull slightly back toward the center so the dot sits on the part, not on a sliver edge.
    out.set(part.id, pick.lerp(center, 0.12));
  }
  return out;
}
