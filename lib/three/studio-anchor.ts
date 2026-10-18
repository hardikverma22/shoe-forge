/** Screen position of the part the studio callout points at. Written by the canvas each frame. */
export const studioAnchor = {
  part: null as string | null,
  x: 0,
  y: 0,
  /** Shoe bounds on screen, for placing the label beside it. */
  right: 0,
  top: 0,
  listeners: new Set<() => void>(),
};
