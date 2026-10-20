import * as THREE from "three";

/**
 * Which way a part faces: the area-weighted mean of its surface normals, each turned to point
 * away from the shoe's center (so inverted or double-sided geometry still counts as outward).
 * The length says how consistent that is: near 1 for a flat sole, near 0 for a part that wraps
 * all the way around (an upper), where there is no single best side to look from.
 *
 * `weight(i)` (0 to 1) limits it to some vertices, e.g. one color region of a textured mesh.
 */
export function partFacing(
  geometries: THREE.BufferGeometry[],
  center: THREE.Vector3,
  weight?: (geometry: THREE.BufferGeometry, vertex: number) => number,
): THREE.Vector3 {
  const sum = new THREE.Vector3();
  let area = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), mid = new THREE.Vector3();
  for (const g of geometries) {
    const pos = g.getAttribute("position");
    if (!pos) continue;
    const idx = g.index;
    const count = idx ? idx.count : pos.count;
    const at = (k: number) => (idx ? idx.getX(k) : k);
    // A few thousand triangles are plenty to know which way a part faces.
    const step = Math.max(3, Math.floor(count / 3 / 4000) * 3);
    for (let t = 0; t + 2 < count; t += step) {
      const i0 = at(t), i1 = at(t + 1), i2 = at(t + 2);
      const w = weight ? (weight(g, i0) + weight(g, i1) + weight(g, i2)) / 3 : 1;
      if (w < 0.5) continue;
      a.fromBufferAttribute(pos, i0);
      b.fromBufferAttribute(pos, i1);
      c.fromBufferAttribute(pos, i2);
      n.subVectors(c, b).cross(a.clone().sub(b));
      const len = n.length();
      if (len < 1e-12) continue;
      mid.copy(a).add(b).add(c).divideScalar(3).sub(center);
      if (n.dot(mid) < 0) n.negate();
      sum.add(n); // |n| is twice the triangle's area
      area += len;
    }
  }
  return area ? sum.divideScalar(area) : sum;
}
