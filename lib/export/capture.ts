"use client";

import { create } from "zustand";

export type CaptureOptions = {
  scale: number;
  transparent: boolean;
  background?: string;
  /** Renders from a specific camera position (used by tech pack views). */
  view?: [number, number, number];
};

type CaptureState = {
  capture: ((opts: CaptureOptions) => Promise<Blob>) | null;
  setCapture: (fn: ((opts: CaptureOptions) => Promise<Blob>) | null) => void;
};

/** Lets UI outside the Canvas render a PNG of the current scene. */
export const useCapture = create<CaptureState>((set) => ({
  capture: null,
  setCapture: (capture) => set({ capture }),
}));

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
}
