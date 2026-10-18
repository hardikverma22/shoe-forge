"use client";

import { useEffect, useRef } from "react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { MATERIALS } from "@/lib/materials/presets";
import { useStudioUI } from "@/lib/design/ui-store";
import { studioAnchor } from "@/lib/three/studio-anchor";
import { partNo } from "./PartRail";

/** A tech-pack callout on the canvas, pointing at the hovered part (or the selected one). */
export function StudioCallout({ product, design }: { product: ProductDef; design: Design }) {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPolylineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const hovered = useStudioUI((s) => s.hoveredPart);
  const selected = useStudioUI((s) => s.selectedPart);
  const dragging = useStudioUI((s) => s.dragging);
  const id = hovered ?? selected;
  const index = product.parts.findIndex((p) => p.id === id);
  const part = product.parts[index];
  const cfg = part ? design.parts[part.id] : undefined;
  const pos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    pos.current = null;
  }, [id]);

  useEffect(() => {
    const onFrame = () => {
      const el = root.current;
      const lb = label.current;
      if (!el || !lb || !studioAnchor.part) return;
      const rect = el.getBoundingClientRect();
      const ax = studioAnchor.x - rect.left;
      const ay = studioAnchor.y - rect.top;
      const right = ax < rect.width * 0.55;
      const w = lb.offsetWidth;
      const h = lb.offsetHeight;
      const tx = Math.min(rect.width - w - 12, Math.max(12, right ? ax + 70 : ax - 70 - w));
      const ty = Math.min(rect.height - h - 72, Math.max(12, ay - 92));
      const p = pos.current ?? { x: tx, y: ty };
      p.x += (tx - p.x) * 0.25;
      p.y += (ty - p.y) * 0.25;
      pos.current = p;
      lb.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      const ex = right ? p.x : p.x + w;
      const ey = p.y + h / 2;
      const elbowX = right ? ex - 16 : ex + 16;
      line.current?.setAttribute("points", `${ax},${ay} ${elbowX},${ey} ${ex},${ey}`);
      dot.current?.setAttribute("cx", String(ax));
      dot.current?.setAttribute("cy", String(ay));
    };
    studioAnchor.listeners.add(onFrame);
    return () => {
      studioAnchor.listeners.delete(onFrame);
    };
  }, []);

  const show = Boolean(part && cfg) && !dragging;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
    >
      <svg className="absolute inset-0 size-full overflow-visible">
        <polyline
          ref={line}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
        <circle ref={dot} r="4" fill="var(--select)" stroke="var(--ink)" strokeWidth="1.25" />
      </svg>
      <div
        ref={label}
        className="bg-ink text-paper absolute top-0 left-0 flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 shadow-[0_12px_30px_-12px_rgb(5_6_26/0.6)] will-change-transform"
      >
        {part && cfg ? (
          <>
            <span className="spec bg-select text-select-ink grid size-7 place-items-center rounded-full font-bold">
              {partNo(index)}
            </span>
            <span className="text-sm font-bold whitespace-nowrap">{part.label}</span>
            <span className="text-xs whitespace-nowrap opacity-70">
              {MATERIALS[cfg.material].label}
            </span>
            <span
              className="border-paper/40 size-3.5 rounded-full border"
              style={{ background: cfg.color }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

/** The printed spec line under the canvas: number, part, material and color code. */
export function SpecReadout({ product, design }: { product: ProductDef; design: Design }) {
  const hovered = useStudioUI((s) => s.hoveredPart);
  const selected = useStudioUI((s) => s.selectedPart);
  const id = hovered ?? selected;
  const index = product.parts.findIndex((p) => p.id === id);
  const part = product.parts[index];
  const cfg = part ? design.parts[part.id] : undefined;
  return (
    <p
      aria-live="polite"
      className="spec bg-surface/85 text-ink hidden min-w-0 truncate rounded-full px-3 py-2 backdrop-blur-sm lg:block"
    >
      {part && cfg ? (
        <>
          {partNo(index)} / {part.label} / {MATERIALS[cfg.material].label} /{" "}
          {cfg.color.toUpperCase()}
          {cfg.roughness !== undefined ? ` / R ${cfg.roughness.toFixed(2)}` : ""}
        </>
      ) : (
        <span className="text-ink-muted">Drag to turn. Scroll to zoom. Click a part.</span>
      )}
    </p>
  );
}
