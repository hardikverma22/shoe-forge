"use client";

import type * as THREE from "three";
import { create } from "zustand";
import type { ModelLayout } from "./layout";

type SceneState = {
  layout: ModelLayout | null;
  /** The product group, used by exports (GLB, PNG, video). */
  root: THREE.Object3D | null;
  /** Callout/focus point per part in model space (textured models publish these directly). */
  anchors: Record<string, [number, number, number]> | null;
  setAnchors: (anchors: Record<string, [number, number, number]> | null) => void;
  /** Which way each part faces, in model space (see lib/three/facing.ts). The camera uses it. */
  facings: Record<string, [number, number, number]> | null;
  setFacings: (facings: Record<string, [number, number, number]> | null) => void;
  setLayout: (layout: ModelLayout | null) => void;
  setRoot: (root: THREE.Object3D | null) => void;
};

export const useSceneMeta = create<SceneState>((set) => ({
  layout: null,
  root: null,
  anchors: null,
  setAnchors: (anchors) => set({ anchors }),
  facings: null,
  setFacings: (facings) => set({ facings }),
  setLayout: (layout) => set({ layout }),
  setRoot: (root) => set({ root }),
}));

// Dev only: lets QA scripts read the scene state (anchors, facings) from the page.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined")
  Object.assign(window, { __sfScene: useSceneMeta });
