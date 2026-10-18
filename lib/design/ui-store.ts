"use client";

import { create } from "zustand";

export type PlacingState = {
  kind: "mark" | "upload" | "text";
  src?: string;
  text?: string;
  font?: string;
  color?: string;
};

type UIState = {
  selectedPart: string | null;
  hoveredPart: string | null;
  view: string | null;
  autoRotate: boolean;
  placing: PlacingState | null;
  selectedGraphic: string | null;
  cameraNonce: number;
  /** Bumped to fly the camera to the selected part (list picks do, clicks on the shoe don't). */
  focusNonce: number;
  /** True while a graphic is being dragged. Orbit controls pause. */
  dragging: boolean;
  set: (patch: Partial<Omit<UIState, "set">>) => void;
};

/** UI-only state. Never part of the undo history. */
export const useStudioUI = create<UIState>((set) => ({
  selectedPart: null,
  hoveredPart: null,
  view: null,
  autoRotate: false,
  placing: null,
  selectedGraphic: null,
  cameraNonce: 0,
  focusNonce: 0,
  dragging: false,
  set: (patch) => set(patch),
}));
