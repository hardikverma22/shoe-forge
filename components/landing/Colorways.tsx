"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { useLanding } from "@/lib/design/landing-store";
import { designFromColorway, stockFor, studioHref } from "@/lib/design/presentation";

gsap.registerPlugin(useGSAP);

const COLORWAYS = forgeRunner.colorways;
export const COLORWAY_COUNT = COLORWAYS.length;

/** Scroll progress through the section → which colorway is showing. */
export const colorwayAt = (p: number) =>
  Math.min(COLORWAY_COUNT - 1, Math.max(0, Math.floor(p * COLORWAY_COUNT)));

/**
 * Pinned (CSS sticky) section. Scrolling flips through the colorways; the whole page stock
 * takes on each pair's own color, and the shoe recolors in place.
 */
export function Colorways({
  reduced,
  onJump,
}: {
  reduced: boolean;
  onJump: (index: number) => void;
}) {
  const section = useRef<HTMLElement>(null);
  const index = useLanding((s) => s.colorwayIndex);
  const c = COLORWAYS[index]!;
  const stock = stockFor(c);
  const design = designFromColorway(forgeRunner, c);
  // Fields vary from yellow to red; secondary text stays at full ink so it always clears 4.5:1.
  const muted = stock.ink;

  useGSAP(
    () => {
      const stage = section.current?.querySelector<HTMLElement>(".cw-stage");
      if (!stage) return;
      const dur = reduced ? 0 : 0.7;
      gsap.to(stage, {
        backgroundColor: stock.field,
        color: stock.ink,
        duration: dur,
        ease: "power2.out",
        overwrite: true,
      });
      if (!reduced) {
        gsap.fromTo(
          ".cw-name",
          { yPercent: 100 },
          { yPercent: 0, duration: 0.8, ease: "expo.out" },
        );
        gsap.fromTo(
          ".cw-fade",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.05, delay: 0.08 },
        );
      }
    },
    { scope: section, dependencies: [index, reduced], revertOnUpdate: false },
  );

  return (
    <section
      ref={section}
      id="colorways"
      data-scene="colorways"
      data-sticky={reduced ? undefined : "true"}
      aria-labelledby="colorways-title"
      className="relative"
      style={{ height: reduced ? "auto" : `${100 + (COLORWAY_COUNT - 1) * 45}svh` }}
    >
      <div
        className={`cw-stage ${reduced ? "min-h-[100svh]" : "sticky top-0 h-[100svh]"} overflow-hidden`}
        style={{
          backgroundColor: stockFor(COLORWAYS[0]!).field,
          color: stockFor(COLORWAYS[0]!).ink,
        }}
      >
        <div className="relative z-30 mx-auto grid h-full w-full max-w-[92rem] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 px-5 py-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:grid-rows-[1fr_auto] md:gap-x-10 md:px-10 md:py-12">
          <div className="flex flex-col justify-center gap-5 md:row-span-1">
            <h2 id="colorways-title" className="overflow-hidden" aria-live="polite">
              <span className="sr-only">Colorway: </span>
              <span key={c.id} className="cw-name display block text-[clamp(3.5rem,9vw,8.5rem)]">
                {c.name}
              </span>
            </h2>
            <p
              key={`${c.id}-story`}
              className="cw-fade max-w-md text-lg leading-snug"
              style={{ color: muted }}
            >
              {c.story}
            </p>
            <ul
              key={`${c.id}-parts`}
              className="flex flex-wrap gap-x-5 gap-y-2"
              aria-label="Parts in this colorway"
            >
              {Object.entries(c.parts).map(([partId, cfg]) => {
                const part = forgeRunner.parts.find((p) => p.id === partId);
                if (!part || !cfg?.color) return null;
                return (
                  <li
                    key={partId}
                    className="cw-fade flex items-center gap-2 text-sm font-semibold"
                  >
                    <span
                      aria-hidden="true"
                      className="size-4 rounded-full border-[1.5px] border-current"
                      style={{ background: cfg.color }}
                    />
                    {part.label}
                    {cfg.material ? (
                      <span className="font-normal" style={{ color: muted }}>
                        {MATERIALS[cfg.material].label}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="cw-fade pt-2">
              <Link
                href={studioHref(design)}
                className="group inline-flex h-13 items-center gap-2 rounded-full px-6 text-base font-bold transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
                style={{ background: stock.ink, color: stock.field }}
              >
                Open {c.name} in the studio
                <ArrowUpRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>

          <div
            data-slot
            className="order-first min-h-[30svh] w-full self-center md:order-none md:aspect-[1.5] md:min-h-0"
          />

          <nav aria-label="Colorways" className="flex min-w-0 items-center gap-4 md:col-span-2">
            <p className="spec tabular shrink-0" aria-hidden="true">
              {String(index + 1).padStart(2, "0")} / {String(COLORWAY_COUNT).padStart(2, "0")}
            </p>
            <ul className="-mx-1 flex min-w-0 gap-1 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              {COLORWAYS.map((cw, i) => (
                <li key={cw.id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => onJump(i)}
                    className="rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-300"
                    style={
                      i === index
                        ? { background: stock.ink, color: stock.field, borderColor: stock.ink }
                        : {
                            borderColor:
                              stock.ink === "#FFFFFF"
                                ? "rgb(255 255 255 / 0.4)"
                                : "rgb(10 10 18 / 0.3)",
                          }
                    }
                  >
                    {cw.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
