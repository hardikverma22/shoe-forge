import * as THREE from "three";

/**
 * The darkest albedo a real shoe material has (black leather, rubber and suede reflect about
 * 3-4% of light). Picked colors are lifted onto this floor, so "Black" renders as black leather
 * with its folds and stitching visible, not as a flat silhouette; mid and light colors barely move.
 */
export const ALBEDO_FLOOR = 0.032;

/** The linear albedo to render for a picked sRGB color. */
export function albedo(hex: string, out = new THREE.Color()): THREE.Color {
  out.set(hex);
  return out.setRGB(
    ALBEDO_FLOOR + out.r * (1 - ALBEDO_FLOOR),
    ALBEDO_FLOOR + out.g * (1 - ALBEDO_FLOOR),
    ALBEDO_FLOOR + out.b * (1 - ALBEDO_FLOOR),
  );
}
