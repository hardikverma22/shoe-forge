"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { rig } from "@/lib/three/landing-rig";
import { LOADER_ART } from "./loader-art";

/**
 * "Casting the pair": the home page's first screen while the 3D shoe loads.
 *
 * The Forge Runner is drawn as a tech-pack line drawing, then molten volt pours into it as the
 * model downloads; each part is stamped into the spec log as it passes. Only when the scene says
 * it is ready (model parsed, shaders compiled, frames steady) does the pour set, a glint runs
 * across it and the sheet lifts to reveal the hero, which starts its own entrance underneath.
 *
 * Server-rendered, so it covers the page from the first paint. The drawing animates in CSS
 * before any JavaScript runs; progress and the exit are driven from one requestAnimationFrame loop.
 */

// The pour runs from just under the sole to just over the top of the drawing (viewBox units).
const POUR_BOTTOM = 318;
const POUR_TOP = 18;
// The pour's surface: a gentle crest band around y = 0, wider than the drawing so it can drift
// without showing an edge. The body of the pour below it is a plain rect.
const WAVE = (() => {
  let d = "M-240 0";
  for (let x = -240; x < 840; x += 60) d += `Q${x + 30} ${x % 120 === 0 ? -7 : 7} ${x + 60} 0`;
  return `${d}L840 8L-240 8Z`;
})();

/** Callouts that pin to the drawing as the pour passes them (anchor and label in viewBox units). */
const PINS = [
  { id: "sole", at: [318, 286], label: [430, 342], from: 0.18 },
  { id: "stripes", at: [300, 214], label: [196, 30], from: 0.42 },
  { id: "tongue", at: [104, 132], label: [18, 72], from: 0.62 },
  { id: "upper", at: [452, 196], label: [520, 92], from: 0.8 },
] as const;

const PARTS = forgeRunner.parts.map((p, i) => ({
  no: String(i + 1).padStart(2, "0"),
  label: p.label,
  material: MATERIALS[p.default.material].label,
}));
const pinPart = (id: string) => {
  const i = forgeRunner.parts.findIndex((p) => p.id === id);
  return { no: String(i + 1).padStart(2, "0"), label: forgeRunner.parts[i]!.label };
};

const [VB_W, VB_H] = LOADER_ART.viewBox.split(" ").slice(2).map(Number) as [number, number];

export function IntroLoader({ onReveal }: { onReveal: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const pour = useRef<SVGGElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const glint = useRef<SVGGElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const announce = useRef<HTMLParagraphElement>(null);
  const revealRef = useRef(onReveal);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    revealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("sf:intro-seen") === "1";
    } catch {
      // storage can be blocked; the long intro is fine then
    }
    // Long enough to read the first time, quick once the model is cached.
    const minMs = reduce ? 300 : seen ? 900 : 2400;
    const start = performance.now();
    document.documentElement.classList.add("sf-loading");

    let ready = false;
    let shown = 0;
    let lastPct = -1;
    let lastSpoken = -1;
    let raf = 0;
    let timeline: gsap.core.Timeline | null = null;
    const onReady = () => (ready = true);
    window.addEventListener("sf:scene-ready", onReady);
    // No WebGL, or something failed: never hold the page hostage.
    const giveUp = window.setTimeout(() => (ready = true), 10000);

    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
    const pins = Array.from(el.querySelectorAll<HTMLElement | SVGElement>("[data-pin]"));

    const render = (p: number) => {
      const pct = Math.round(p * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        if (counter.current) counter.current.textContent = String(pct).padStart(3, "0");
        if (phase.current)
          phase.current.textContent =
            p >= 1 ? "Ready" : p < 0.86 ? "Pouring the model" : "Setting the materials";
        if (announce.current && Math.floor(pct / 25) !== lastSpoken) {
          lastSpoken = Math.floor(pct / 25);
          announce.current.textContent = p >= 1 ? "Loaded" : `Loading the 3D shoe, ${pct} percent`;
        }
      }
      pour.current?.setAttribute("transform", `translate(0 ${POUR_BOTTOM - p * (POUR_BOTTOM - POUR_TOP)})`);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      rows.forEach((r, i) => r.toggleAttribute("data-on", p >= (i + 1) / (rows.length + 1)));
      pins.forEach((n) => n.toggleAttribute("data-on", p >= Number(n.dataset.from)));
    };

    const exit = () => {
      try {
        sessionStorage.setItem("sf:intro-seen", "1");
      } catch {
        // see above
      }
      const lift = () => {
        document.documentElement.classList.remove("sf-loading");
        window.dispatchEvent(new Event("sf:intro-go"));
        revealRef.current();
      };
      if (reduce) {
        lift();
        timeline = gsap.timeline({ onComplete: () => setGone(true) }).to(el, { autoAlpha: 0, duration: 0.25 });
        return;
      }
      timeline = gsap
        .timeline({ onComplete: () => setGone(true) })
        // The pour settles flat, a glint runs across the cast, then the sheet lifts.
        .to(wave.current, { scaleY: 0, svgOrigin: "0 4", duration: 0.5, ease: "power2.out" })
        .fromTo(glint.current, { x: -260 }, { x: VB_W + 60, duration: 0.75, ease: "power2.inOut" }, "<0.1")
        .add(lift, "-=0.15")
        .to(art.current, { y: -40, scale: 0.96, autoAlpha: 0, duration: 0.6, ease: "power3.in" }, "<")
        .to(sheet.current, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, "<0.05");
    };

    let last = start;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      // Eased by elapsed time, not per frame: a weak GPU (or software WebGL) may only manage a
      // few frames a second, and per-frame easing would then take forever to reach 100%.
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      // Downloads fill most of the mold; the last stretch is the scene compiling its shaders.
      // three.js counts finished files, not bytes (the model reads 0% until it lands), so a floor
      // creeps toward the download ceiling to keep the pour moving on a slow connection.
      const floor = 0.84 * (1 - Math.exp(-t / 4.5));
      const done = ready && now - start >= minMs;
      const target = done ? 1 : Math.min(0.96, Math.max(floor, rig.loadProgress * 0.86));
      shown += (target - shown) * (1 - Math.exp(-dt * (done ? 9 : 3)));
      // Done means done within a moment, however slowly frames come.
      if (done && (1 - shown < 0.004 || now - start > minMs + 1500)) shown = 1;
      render(shown);
      if (shown === 1) {
        exit();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(giveUp);
      window.removeEventListener("sf:scene-ready", onReady);
      timeline?.kill();
      document.documentElement.classList.remove("sf-loading");
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="sf-loader fixed inset-0 z-[200] overflow-hidden" aria-label="Loading">
      <div ref={sheet} className="sweep text-night relative flex h-full flex-col will-change-transform">
        <p ref={announce} role="status" className="sr-only">
          Loading the 3D shoe
        </p>

        <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-5 py-5 md:px-10">
          <span className="inline-flex items-center gap-1.5" aria-hidden="true">
            <svg width="30" height="22" viewBox="0 0 30 22" className="shrink-0">
              <circle cx="8" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="11" r="2.4" fill="currentColor" className="sf-loader-blink" />
              <path d="M14.5 11H29" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="display text-[1.55rem] leading-none tracking-[-0.01em]">Shoe Forge</span>
          </span>
          <span className="spec text-on-sweep-2 hidden sm:inline">Forge Runner / build 001</span>
        </div>

        {/* The drawing: outline, then the pour, then the construction lines and pinned parts. */}
        <div className="grid min-h-0 flex-1 place-items-center px-5">
          <div ref={art} className="relative w-full max-w-[min(56rem,140svh)]">
            <svg viewBox={LOADER_ART.viewBox} className="block w-full overflow-visible" aria-hidden="true">
              <defs>
                <clipPath id="sf-mold">
                  <path d={LOADER_ART.outline} />
                </clipPath>
                <linearGradient id="sf-melt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#E4FF6A" />
                  <stop offset="0.35" stopColor="#D7FF3A" />
                  <stop offset="1" stopColor="#B4DC12" />
                </linearGradient>
                <linearGradient id="sf-glint" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Floor shadow, so the drawing sits on the sweep like the 3D shoe will. */}
              <ellipse cx="305" cy="318" rx="250" ry="10" className="fill-night/10" />

              <g clipPath="url(#sf-mold)">
                <g ref={pour} transform={`translate(0 ${POUR_BOTTOM})`}>
                  <rect x="-240" y="4" width="1080" height="420" fill="url(#sf-melt)" />
                  <g className="sf-loader-drift">
                    <path ref={wave} d={WAVE} fill="#DFFF55" />
                  </g>
                </g>
                <g ref={glint} transform="translate(-260 0)">
                  <rect x="0" y="0" width="200" height={VB_H} fill="url(#sf-glint)" transform="skewX(-18)" />
                </g>
              </g>

              <path d={LOADER_ART.outline} pathLength={1} className="sf-loader-draw fill-none stroke-night" strokeWidth="1.6" strokeLinejoin="round" />
              <path d={LOADER_ART.sole} pathLength={1} className="sf-loader-draw sf-loader-late fill-none stroke-night" strokeWidth="1.1" strokeLinejoin="round" />
              <path d={LOADER_ART.stripes} pathLength={1} className="sf-loader-draw sf-loader-later fill-none stroke-night" strokeWidth="1.1" strokeLinejoin="round" />

              {PINS.map((p) => {
                const [ax, ay] = p.at;
                const [lx, ly] = p.label;
                return (
                  <g key={p.id} data-pin data-from={p.from} className="sf-loader-pin max-sm:hidden">
                    <polyline points={`${ax},${ay} ${lx},${ay + (ly - ay) * 0.7} ${lx},${ly}`} className="fill-none stroke-night" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
                    <circle cx={ax} cy={ay} r="4.2" className="fill-volt stroke-night" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
            </svg>

            {/* Labels in HTML so they stay readable at any size. */}
            {PINS.map((p) => {
              const part = pinPart(p.id);
              return (
                <span
                  key={p.id}
                  data-pin
                  data-from={p.from}
                  aria-hidden="true"
                  className="sf-loader-pin bg-night text-sheet absolute hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-bold whitespace-nowrap sm:inline-flex"
                  style={{ left: `${(p.label[0] / VB_W) * 100}%`, top: `${(p.label[1] / VB_H) * 100}%` }}
                >
                  <span className="spec bg-volt text-night grid size-5 place-items-center rounded-full font-bold">{part.no}</span>
                  {part.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[92rem] grid-cols-[auto_1fr] items-end gap-6 px-5 pb-6 md:gap-12 md:px-10 md:pb-8">
          <div>
            <p className="spec text-on-sweep-2 uppercase" aria-hidden="true">
              Casting the pair
            </p>
            <p className="display tabular mt-1 flex items-start leading-[0.8]" aria-hidden="true">
              <span ref={counter} className="text-[clamp(4.5rem,13vw,11rem)]">
                000
              </span>
              <span className="mt-[0.2em] ml-1 text-[clamp(1.5rem,3vw,2.5rem)]">%</span>
            </p>
            <span ref={phase} className="spec text-on-sweep-2 mt-3 block" aria-hidden="true">
              Pouring the model
            </span>
          </div>

          <ol className="hidden justify-self-end sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-1.5" aria-hidden="true">
            {PARTS.map((p) => (
              <li key={p.no} data-row className="sf-loader-row spec flex items-center gap-2.5">
                <span className="sf-loader-tick border-night/30 size-2.5 shrink-0 rounded-[2px] border" />
                <span className="w-5">{p.no}</span>
                <span className="w-24 truncate">{p.label}</span>
                <span className="text-on-sweep-2">{p.material}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-night/10 h-px w-full">
          <div ref={bar} className="bg-night h-px w-full origin-left scale-x-0" />
        </div>
      </div>
    </div>
  );
}
