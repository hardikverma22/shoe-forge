import * as THREE from "three";

/** Quaternion that points a decal's +Z along the surface normal, then spins it by `rotation` radians. */
export function decalOrientation(normal: [number, number, number], rotation: number): THREE.Quaternion {
  const n = new THREE.Vector3(...normal).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotation);
  return q.multiply(spin);
}
