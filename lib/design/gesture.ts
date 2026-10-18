"use client";

import { useState } from "react";
import { history } from "./store";

export type HistoryGesture<T> = {
  onStart: (initial: T) => void;
  onChange: (value: T) => void;
  onEnd: (value: T) => void;
};

/**
 * Continuous controls (color drag, sliders, graphic drag) write many values while the user drags.
 * Undo tracking is paused during the drag. On release the state is reverted silently to the
 * starting value, then the final value is applied once, so one undo step restores the start.
 * Plain factory: safe to call from event handlers.
 */
export function createHistoryGesture<T>(apply: (value: T) => void): HistoryGesture<T> {
  let active = false;
  let baseline: T | null = null;
  return {
    onStart: (initial) => {
      if (active) return;
      active = true;
      baseline = initial;
      history.pause();
    },
    onChange: (value) => {
      if (active) apply(value);
    },
    onEnd: (value) => {
      if (!active) return;
      active = false;
      if (baseline !== null) apply(baseline);
      history.resume();
      apply(value);
      baseline = null;
    },
  };
}

/** Hook form for components: one gesture per component instance. */
export function useHistoryGesture<T>(apply: (value: T) => void): HistoryGesture<T> {
  // apply only reads the store through getState(), so the first closure stays valid.
  const [gesture] = useState(() => createHistoryGesture(apply));
  return gesture;
}
