"use client";

import { create } from "zustand";
import { forgeRunner } from "@/lib/products/forge-runner";
import { defaultDesign } from "./defaults";
import { designFromColorway } from "./presentation";
import type { Design } from "./types";

/** The pair on the home page hero, editable right there. */
function heroDesign(): Design {
  const d = defaultDesign(forgeRunner, "My first pair");
  const set = (id: string, material: Design["parts"][string]["material"], color: string) => {
    if (d.parts[id]) d.parts[id] = { material, color };
  };
  set("upper", "leather", "#F4F4F2");
  set("toecap", "suede", "#F4F4F2");
  set("laces", "canvas", "#F4F4F2");
  set("lining", "mesh", "#FF4A1C");
  set("sole", "rubber", "#F4F4F2");
  set("stripes", "patent", "#FF4A1C");
  set("heel", "leather", "#0A0A12");
  set("tongue", "suede", "#0A0A12");
  return d;
}

const COLORWAY_DESIGNS = Object.fromEntries(
  forgeRunner.colorways.map((c) => [c.id, designFromColorway(forgeRunner, c)]),
);

type LandingState = {
  hero: Design;
  /** "hero" or a colorway id: which pair the scene shows. */
  showing: string;
  /** Which colorway the colorway section is on. */
  colorwayIndex: number;
  /** Which stop of the part tour is showing. */
  tourIndex: number;
  /** The part the tour is pointing at (null outside the tour). */
  tourPart: string | null;
  setTour: (index: number, part: string | null) => void;
  setShowing: (key: string) => void;
  setColorwayIndex: (i: number) => void;
  setHeroColor: (partId: string, color: string) => void;
};

export const useLanding = create<LandingState>((set) => ({
  hero: heroDesign(),
  showing: "hero",
  colorwayIndex: 0,
  tourIndex: 0,
  tourPart: null,
  setTour: (index, part) =>
    set((s) =>
      s.tourIndex === index && s.tourPart === part ? s : { tourIndex: index, tourPart: part },
    ),
  setShowing: (key) => set((s) => (s.showing === key ? s : { showing: key })),
  setColorwayIndex: (i) => set((s) => (s.colorwayIndex === i ? s : { colorwayIndex: i })),
  setHeroColor: (partId, color) =>
    set((s) => {
      const part = s.hero.parts[partId];
      if (!part) return s;
      return { hero: { ...s.hero, parts: { ...s.hero.parts, [partId]: { ...part, color } } } };
    }),
}));

/** A blank, undyed pair: every part in its default material, all in raw off-white. */
function blankDesign(): Design {
  const d = defaultDesign(forgeRunner, "Blank");
  for (const id of Object.keys(d.parts)) d.parts[id] = { ...d.parts[id]!, color: "#ECEAE4" };
  return d;
}

/** The pair the build section makes, one part at a time (product order). */
export const BUILD_STEPS: {
  part: string;
  material: Design["parts"][string]["material"];
  color: string;
  colorName: string;
}[] = [
  { part: "upper", material: "suede", color: "#D8C3A5", colorName: "Sand" },
  { part: "laces", material: "canvas", color: "#F4F4F2", colorName: "Chalk" },
  { part: "toecap", material: "leather", color: "#8A5A3B", colorName: "Saddle" },
  { part: "lining", material: "mesh", color: "#FF4A1C", colorName: "Signal" },
  { part: "sole", material: "rubber", color: "#EFE6D6", colorName: "Bone" },
  { part: "stripes", material: "patent", color: "#1B1B1F", colorName: "Ink" },
  { part: "heel", material: "leather", color: "#FF4A1C", colorName: "Signal" },
  { part: "tongue", material: "suede", color: "#8A5A3B", colorName: "Saddle" },
];

const BUILD_DESIGNS: Design[] = (() => {
  const out: Design[] = [];
  let d = blankDesign();
  out.push(d);
  for (const step of BUILD_STEPS) {
    d = {
      ...d,
      name: "Dune runner",
      parts: { ...d.parts, [step.part]: { material: step.material, color: step.color } },
    };
    out.push(d);
  }
  return out;
})();

/** Build state n: 0 = blank, 8 = finished. */
export const buildDesign = (n: number) =>
  BUILD_DESIGNS[Math.max(0, Math.min(BUILD_DESIGNS.length - 1, n))]!;

export function shownDesign(state: Pick<LandingState, "hero" | "showing">): Design {
  if (state.showing === "hero") return state.hero;
  if (state.showing.startsWith("build:")) return buildDesign(Number(state.showing.slice(6)));
  return COLORWAY_DESIGNS[state.showing] ?? state.hero;
}
