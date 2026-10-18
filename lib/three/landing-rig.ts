/**
 * Shared, mutable state between the home page's scroll choreography (DOM, GSAP) and its
 * 3D scene (R3F). Written and read every frame, so it lives outside React on purpose.
 */

export type Pose = {
  /** Shoe center on screen, as fractions of the viewport. */
  cx: number;
  cy: number;
  /** Shoe length on screen, as a fraction of min(viewport width, 1.6 × height). */
  size: number;
  /** Turntable angle in radians, added to the sway and drag. */
  yaw: number;
  /** 0 = assembled, 1 = fully exploded. */
  explode: number;
  /** Continuous spin in radians per second (0 = sway in place). */
  spin: number;
  /** Callout overlay opacity. */
  callouts: number;
};

export type Anchor = { x: number; y: number };

export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
};

export const HERO_POSE: Pose = {
  cx: 0.68,
  cy: 0.54,
  size: 0.5,
  yaw: 0,
  explode: 0,
  spin: 0,
  callouts: 1,
};

export const rig = {
  target: { ...HERO_POSE } as Pose,
  current: { ...HERO_POSE } as Pose,
  /** Accumulated spin angle. */
  spinAngle: 0,
  /** Yaw added by dragging, eased back toward zero when released. */
  dragYaw: 0,
  dragging: false,
  /** True right after a drag, so the release doesn't count as a click on a part. */
  justDragged: false,
  /** Pointer in -1..1, for a slight parallax tilt. */
  pointer: { x: 0, y: 0 },
  /** Whether the shoe can be hovered and clicked right now (hero only). */
  interactive: true,
  /** Freezes the sway while a part is being edited. */
  hold: false,
  /** Leader line color: white on night, ink on the light sweep. */
  lineColor: "#ffffff",
  /** When set, only this part's callout shows (the part tour). */
  only: null as string | null,
  /** Callouts show only their part number (exploded view, small screens). */
  compact: false,
  /** 1 while scrolling down, -1 while scrolling up. */
  direction: 1 as 1 | -1,
  /** Entrance progress, 0 (below, hidden) to 1 (in place). Tweened once the scene is ready. */
  intro: 1,
  /** Set once the scene has compiled and drawn its first frames. */
  sceneReady: false,
  /** Skip easing (reduced motion). */
  instant: false,
  /** Written by the scene each frame, in CSS pixels. */
  anchors: {} as Record<string, Anchor>,
  bounds: { left: 0, right: 0, top: 0, bottom: 0, cx: 0, cy: 0 } as Bounds,
  /** Called by the scene after anchors are written, inside the same animation frame. */
  listeners: new Set<() => void>(),
};

export function setPose(patch: Partial<Pose>) {
  Object.assign(rig.target, patch);
}
