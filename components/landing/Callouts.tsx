"use client";

import { useEffect, useRef } from "react";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { useLanding } from "@/lib/design/landing-store";
import { useStudioUI } from "@/lib/design/ui-store";
import { rig } from "@/lib/three/landing-rig";

const PARTS = forgeRunner.parts;
export const HERO_SWATCHES = [
  "#F4F4F2",
  "#0A0A12",
  "#D7FF3A",
  "#FF4A1C",
  "#1E2BFF",
  "#C08A55",
  "#F2C14E",
  "#3A7D44",
  "#7A4FD0",
  "#E86FA1",
];

type Placed = { x: number; y: number; top: boolean };

export const partNumber = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Tech-pack callouts tethered to the 3D shoe. Labels sit on a rail above and below the shoe,
 * leader lines run to each part's center, and positions update in the scene's own frame.
 */
export function Callouts() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const lines = useRef<Record<string, SVGPolylineElement | null>>({});
  const dots = useRef<Record<string, SVGCircleElement | null>>({});
  const tray = useRef<HTMLDivElement>(null);
  const shown = useRef<Record<string, Placed>>({});
  const widths = useRef<Record<string, number>>({});
  const visible = useRef(false);

  const hero = useLanding((s) => s.hero);
  const setHeroColor = useLanding((s) => s.setHeroColor);
  const hovered = useStudioUI((s) => s.hoveredPart);
  const selected = useStudioUI((s) => s.selectedPart);
  const selectedRef = useRef(selected);

  // Hold the shoe still while a part is pointed at or being edited, so labels stop moving under the cursor.
  useEffect(() => {
    selectedRef.current = selected;
    rig.hold = selected !== null || hovered !== null;
  }, [selected, hovered]);

  // Label widths change with compact mode, fonts and hover; observe them instead of reading every frame.
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.part;
        if (id) widths.current[id] = (entry.target as HTMLElement).offsetWidth;
      }
    });
    for (const p of PARTS) {
      const el = labels.current[p.id];
      if (el) ro.observe(el);
    }
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onFrame = () => {
      const el = root.current;
      if (!el) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const opacity = rig.sceneReady ? rig.current.callouts * rig.intro * rig.intro : 0;
      // Before the entrance, lay the labels out invisibly so their first paint isn't a hitch.
      const isVisible = !rig.sceneReady || opacity > 0.04;
      el.style.opacity = String(Math.min(1, opacity));
      if (isVisible !== visible.current) {
        visible.current = isVisible;
        el.style.visibility = isVisible ? "visible" : "hidden";
        if (!isVisible && selectedRef.current) useStudioUI.getState().set({ selectedPart: null });
      }
      if (!isVisible) return;

      const compact = rig.compact || W < 700;
      el.dataset.compact = compact ? "true" : "false";
      el.style.setProperty("--callout-line", rig.lineColor);
      const b = rig.bounds;
      const byY = [...PARTS].sort(
        (a, c) => (rig.anchors[a.id]?.y ?? 0) - (rig.anchors[c.id]?.y ?? 0),
      );
      const rails = [
        { parts: byY.slice(0, 4), top: true },
        { parts: byY.slice(4), top: false },
      ];
      // Labels keep the page gutter; leader endpoints never leave the viewport.
      const margin = W < 700 ? 16 : 40;
      const gap = compact ? 10 : 14;

      for (const rail of rails) {
        const sorted = [...rail.parts].sort(
          (a, c) => (rig.anchors[a.id]?.x ?? 0) - (rig.anchors[c.id]?.x ?? 0),
        );
        const ws = sorted.map((p) => widths.current[p.id] ?? (compact ? 30 : 120));
        // Desired centers follow the anchors, then get pushed apart so labels never overlap.
        const xs = sorted.map((p) => rig.anchors[p.id]?.x ?? b.cx);
        for (let i = 1; i < xs.length; i++) {
          const min = xs[i - 1]! + (ws[i - 1]! + ws[i]!) / 2 + gap;
          if (xs[i]! < min) xs[i] = min;
        }
        // Keep the whole rail inside the viewport.
        const last = xs.length - 1;
        const overRight = xs[last]! + ws[last]! / 2 - (W - margin);
        if (overRight > 0) for (let i = 0; i <= last; i++) xs[i]! -= overRight;
        for (let i = last - 1; i >= 0; i--) {
          const max = xs[i + 1]! - (ws[i + 1]! + ws[i]!) / 2 - gap;
          if (xs[i]! > max) xs[i] = max;
        }
        const overLeft = margin - (xs[0]! - ws[0]! / 2);
        if (overLeft > 0) for (let i = 0; i <= last; i++) xs[i]! += overLeft;

        const railY = rail.top
          ? Math.max(96, b.top - (compact ? 34 : 46))
          : Math.min(H - 40, b.bottom + (compact ? 26 : 34));
        sorted.forEach((p, i) => {
          let target = { x: xs[i]!, y: railY, top: rail.top };
          // A single callout (the build) sits right beside its part instead of on a rail.
          const solo = rig.only === p.id ? rig.anchors[p.id] : undefined;
          if (solo) {
            const w = widths.current[p.id] ?? 120;
            const side = solo.x > b.cx ? 1 : -1;
            const x = Math.min(
              W - margin - w / 2,
              Math.max(margin + w / 2, solo.x + side * (w / 2 + 70)),
            );
            const y = Math.min(H - 48, Math.max(96, solo.y - 74));
            target = { x, y, top: y < solo.y };
          }
          const prev = shown.current[p.id];
          const k = rig.instant || !prev ? 1 : 0.22;
          // Ease toward the target, then snap, so settled labels hold perfectly still.
          const ease = (from: number, to: number) =>
            Math.abs(to - from) < 0.4 ? to : from + (to - from) * k;
          const placed: Placed = prev
            ? { x: ease(prev.x, target.x), y: ease(prev.y, target.y), top: rail.top }
            : target;
          shown.current[p.id] = placed;

          const label = labels.current[p.id];
          const a = rig.anchors[p.id];
          // Only the toured part during the tour; and no leader to an anchor that left the screen.
          const offscreen = !a || a.x < 0 || a.x > W || a.y < 0 || a.y > H;
          const hidden = rig.only !== null && rig.only !== p.id;
          if (label) {
            label.style.opacity = hidden ? "0" : "";
            label.style.pointerEvents = hidden ? "none" : "";
            label.tabIndex = hidden ? -1 : 0;
          }
          const group = lines.current[p.id]?.parentNode as SVGGElement | null | undefined;
          if (group) group.style.display = hidden || offscreen ? "none" : "";
          if (label)
            label.style.transform = `translate3d(${Math.round(placed.x)}px, ${Math.round(placed.y)}px, 0) translate(-50%, -50%)`;
          const line = lines.current[p.id];
          const dot = dots.current[p.id];
          if (a && line && dot) {
            const stub = rail.top ? placed.y + 15 : placed.y - 15;
            const edge = rail.top ? placed.y + 9 : placed.y - 9;
            const ax = Math.min(W - 8, Math.max(8, a.x));
            const ay = Math.min(H - 8, Math.max(8, a.y));
            line.setAttribute("points", `${ax},${ay} ${placed.x},${stub} ${placed.x},${edge}`);
            dot.setAttribute("cx", String(ax));
            dot.setAttribute("cy", String(ay));
          }
        });
      }

      // The color tray follows its label.
      const sel = selectedRef.current;
      const t = tray.current;
      if (t && sel && shown.current[sel]) {
        const p = shown.current[sel];
        const tw = t.offsetWidth;
        const x = Math.min(W - tw - margin, Math.max(margin, p.x - tw / 2));
        const y = p.top ? p.y - t.offsetHeight - 26 : p.y + 26;
        t.style.transform = `translate3d(${x}px, ${Math.max(84, y)}px, 0)`;
      }
    };
    rig.listeners.add(onFrame);
    return () => {
      rig.listeners.delete(onFrame);
    };
  }, []);

  // Escape closes the tray; clicking outside the callouts does too.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        labels.current[selected]?.focus();
        useStudioUI.getState().set({ selectedPart: null });
      }
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // A press on the shoe itself (a hovered part) re-targets the tray instead of closing it.
      if (target.closest("[data-callouts]") || useStudioUI.getState().hoveredPart) return;
      useStudioUI.getState().set({ selectedPart: null });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [selected]);

  const selectedPart = PARTS.find((p) => p.id === selected);
  const selectedCfg = selected ? hero.parts[selected] : undefined;

  return (
    <div
      ref={root}
      data-callouts
      className="group/callouts pointer-events-none fixed inset-0 z-[35]"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <svg ref={svg} aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
        {PARTS.map((p) => {
          const active = hovered === p.id || selected === p.id;
          return (
            <g
              key={p.id}
              className="transition-opacity duration-200"
              style={{ opacity: hovered || selected ? (active ? 1 : 0.35) : 0.85 }}
            >
              <polyline
                ref={(el) => {
                  lines.current[p.id] = el;
                }}
                fill="none"
                stroke={active ? "var(--volt)" : "var(--callout-line, #ffffff)"}
                strokeWidth={active ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                ref={(el) => {
                  dots.current[p.id] = el;
                }}
                r={active ? 4.5 : 3}
                fill={active ? "var(--volt)" : "var(--callout-line, #ffffff)"}
                stroke="var(--night)"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </svg>

      {PARTS.map((p, i) => {
        const cfg = hero.parts[p.id];
        const active = hovered === p.id || selected === p.id;
        return (
          <button
            key={p.id}
            ref={(el) => {
              labels.current[p.id] = el;
            }}
            type="button"
            data-part={p.id}
            aria-expanded={selected === p.id}
            aria-controls={selected === p.id ? "callout-tray" : undefined}
            aria-label={`${partNumber(i)} ${p.label}, ${cfg ? `${MATERIALS[cfg.material].label}, ${cfg.color}` : ""}. Change color`}
            onPointerEnter={() => useStudioUI.getState().set({ hoveredPart: p.id })}
            onPointerLeave={() => useStudioUI.getState().set({ hoveredPart: null })}
            onFocus={() => useStudioUI.getState().set({ hoveredPart: p.id })}
            onBlur={() => useStudioUI.getState().set({ hoveredPart: null })}
            onClick={() =>
              useStudioUI.getState().set({ selectedPart: selected === p.id ? null : p.id })
            }
            className={`pointer-events-auto absolute top-0 left-0 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-left text-[0.8125rem] leading-none font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 will-change-transform group-data-[compact=true]/callouts:p-0 ${
              active
                ? "bg-volt text-night shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)]"
                : "bg-night/85 text-sheet hover:bg-night"
            }`}
          >
            <span
              className={`spec grid size-6 shrink-0 place-items-center rounded-full border text-[0.625rem] font-bold ${
                active ? "border-night" : "border-sheet/60"
              }`}
            >
              {partNumber(i)}
            </span>
            <span className="group-data-[compact=true]/callouts:hidden">{p.label}</span>
            <span
              aria-hidden="true"
              className="flex items-center gap-1 group-data-[compact=true]/callouts:hidden"
            >
              <span
                className="size-3 rounded-full border border-current/40"
                style={{ background: cfg?.color }}
              />
            </span>
          </button>
        );
      })}

      {selectedPart && selectedCfg ? (
        <div
          id="callout-tray"
          ref={tray}
          role="group"
          aria-label={`${selectedPart.label} color`}
          className="bg-sheet text-night pointer-events-auto absolute top-0 left-0 w-[17.5rem] rounded-2xl p-3 shadow-[0_24px_60px_-20px_rgb(5_6_26/0.6)]"
          style={{ transform: "translate3d(-999px,-999px,0)" }}
        >
          <div className="mb-2.5 flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold">{selectedPart.label}</p>
            <p className="spec text-ink-muted">
              {MATERIALS[selectedCfg.material].label} · {selectedCfg.color.toUpperCase()}
            </p>
          </div>
          <div role="radiogroup" aria-label="Colors" className="grid grid-cols-5 gap-2">
            {HERO_SWATCHES.map((hex) => {
              const checked = selectedCfg.color.toUpperCase() === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`Color ${hex}`}
                  onClick={() => setHeroColor(selectedPart.id, hex)}
                  className={`border-night/15 aspect-square rounded-full border transition-transform duration-200 ease-[var(--ease-out-expo)] hover:scale-110 ${
                    checked ? "ring-night ring-offset-sheet ring-2 ring-offset-2" : ""
                  }`}
                  style={{ background: hex }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
