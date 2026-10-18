"use client";

import type * as THREE from "three";
import { create } from "zustand";
import type { ModelLayout } from "./layout";

type SceneState = {
  layout: ModelLayout | null;
  /** The product group, used by exports (GLB, PNG, video). */
  root: THREE.Object3D | null;
  setLayout: (layout: ModelLayout | null) => void;
  setRoot: (root: THREE.Object3D | null) => void;
};

export const useSceneMeta = create<SceneState>((set) => ({
  layout: null,
  root: null,
  setLayout: (layout) => set({ layout }),
  setRoot: (root) => set({ root }),
}));
