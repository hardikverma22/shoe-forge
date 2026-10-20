"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIAL_LIST } from "@/lib/materials/presets";
import type { MaterialId } from "@/lib/products/schema";
import { inkOn, shade } from "@/lib/design/presentation";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One strong color per material so the swatch book reads as a printed sample card. */
const SWATCH: Record<MaterialId, string> = {
  leather: "#C08A55",
  suede: "#3A7D44",
  knit: "#1E2BFF",
  mesh: "#FF4A1C",
  canvas: "#F2C14E",
  rubber: "#E86FA1",
  patent: "#0A0A12",
};

const usedOn = (id: MaterialId) =>
  forgeRunner.parts.filter((p) => p.allowedMaterials.includes(id)).map((p) => p.label);

function Meter({ label, value, ink }: { label: string; value: number; ink: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="spec w-20 shrink-0">{label}</span>
      <span
        className="relative h-px flex-1"
        style={{ background: `color-mix(in oklab, ${ink} 35%, transparent)` }}
      >
        <span
          className="absolute -top-[3px] size-[7px] rounded-full"
          style={{ left: `calc(${value * 100}% - 3px)`, background: ink }}
        />
      </span>
      <span className="spec w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

export function Materials() {
  const section = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<MaterialId>("leather");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".mat-strip", {
          yPercent: 18,
          opacity: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: ".mat-book", start: "top 85%", once: true },
        });
        gsap.from(".mat-title .split-line", {
          yPercent: 105,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".mat-title", start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      data-scene="materials"
      aria-labelledby="materials-title"
      className="bg-sheet text-night relative"
    >
      <div className="relative z-30 mx-auto max-w-[92rem] px-5 py-24 md:px-10 md:py-36">
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[1fr_minmax(0,26rem)] md:items-end">
          <h2 id="materials-title" className="mat-title display text-[clamp(3rem,7.5vw,7rem)]">
            <span className="block overflow-hidden">
              <span className="split-line block">Seven materials.</span>
            </span>
            <span className="block overflow-hidden">
              <span className="split-line text-night/40 block">Real surfaces.</span>
            </span>
          </h2>
          <p className="text-on-sweep-2 text-lg leading-snug">
            Every material carries its own grain, roughness and shine, so suede looks soft and
            patent catches the light. Each part only offers the materials a factory would actually
            use there.
          </p>
        </div>

        <ul className="mat-book flex flex-col gap-2 md:h-[34rem] md:flex-row">
          {MATERIAL_LIST.map((m) => {
            const isOpen = open === m.id;
            const color = SWATCH[m.id];
            // The relief multiplies the color down, so pick ink against the darkened surface,
            // and lay a field-tinted scrim under the text so grain never breaks 4.5:1.
            const ink = inkOn(shade(color, 0.62));
            const scrim =
              ink === "#FFFFFF"
                ? "linear-gradient(to bottom, rgb(0 0 0 / 0.38), transparent 32%, transparent 45%, rgb(0 0 0 / 0.55))"
                : "linear-gradient(to bottom, rgb(255 255 255 / 0.45), transparent 32%, transparent 45%, rgb(255 255 255 / 0.6))";
            return (
              <li
                key={m.id}
                className={`mat-strip relative min-w-0 overflow-hidden rounded-[var(--radius-card)] transition-[flex-grow,height] duration-700 ease-[var(--ease-out-expo)] md:h-full ${
                  isOpen ? "h-80 md:flex-[4.2]" : "h-[4.5rem] md:flex-1"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`mat-${m.id}`}
                  onClick={() => setOpen(m.id)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setOpen(m.id);
                  }}
                  onFocus={() => setOpen(m.id)}
                  data-material={m.id}
                  className="swatch-surface absolute inset-0 flex size-full flex-col justify-between p-5 text-left"
                  style={
                    {
                      "--swatch": color,
                      "--relief": `url(/textures/${m.id}/swatch.webp)`,
                      "--relief-size": m.id === "knit" ? "200px" : "320px",
                      color: ink,
                    } as React.CSSProperties
                  }
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: scrim }}
                  />
                  <span className="relative flex w-full items-baseline justify-between gap-x-3 md:flex-col md:items-start md:gap-1.5">
                    <span className="display text-[2rem] md:text-[2.5rem]">{m.label}</span>
                    <span className="spec">{color}</span>
                  </span>
                  <span
                    id={`mat-${m.id}`}
                    className={`relative flex max-w-sm flex-col gap-4 transition-opacity duration-500 ${isOpen ? "opacity-100 delay-200" : "pointer-events-none opacity-0"}`}
                  >
                    <span className="text-base leading-snug font-semibold">{m.description}.</span>
                    <span className="flex flex-col gap-2.5">
                      <Meter label="Roughness" value={m.roughness} ink={ink} />
                      <Meter label="Sheen" value={m.sheen} ink={ink} />
                      <Meter label="Clearcoat" value={m.clearcoat} ink={ink} />
                    </span>
                    <span className="text-sm leading-snug">
                      Used on {usedOn(m.id).join(", ").toLowerCase()}.
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
