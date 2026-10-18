"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Check } from "lucide-react";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { BUILD_STEPS, buildDesign, useLanding } from "@/lib/design/landing-store";
import { studioHref } from "@/lib/design/presentation";
import { partNumber } from "./Callouts";

gsap.registerPlugin(useGSAP);

/** Number of build states: the blank pair, then one per step. */
export const BUILD_STATES = BUILD_STEPS.length + 1;

/** The angle that shows each step's part best (toe is +x; 0 faces the side). Index 0 = blank. */
export const BUILD_YAW = [-0.45, -0.45, -0.6, -0.95, 0.65, -0.3, -0.1, 0.85, 1.05];

/** Scroll progress through the section → build state (0 = blank … 8 = finished). */
export const buildAt = (p: number) =>
  Math.min(BUILD_STATES - 1, Math.max(0, Math.floor(p * BUILD_STATES)));

const partOf = (id: string) => forgeRunner.parts.find((p) => p.id === id)!;
const partIndex = (id: string) => forgeRunner.parts.findIndex((p) => p.id === id);

/**
 * Pinned (CSS sticky) build: a blank pair gets made one part at a time as you scroll. The
 * shoe recolors in place and the build sheet on the left ticks off each step.
 */
export function Tour({ reduced, onJump }: { reduced: boolean; onJump: (state: number) => void }) {
  const section = useRef<HTMLElement>(null);
  const state = useLanding((s) => s.tourIndex);
  const done = state === BUILD_STATES - 1;

  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(
        ".build-active",
        { backgroundColor: "rgba(215,255,58,0.28)" },
        { backgroundColor: "rgba(215,255,58,0.08)", duration: 0.9, ease: "expo.out" },
      );
    },
    { scope: section, dependencies: [state, reduced], revertOnUpdate: false },
  );

  return (
    <section
      ref={section}
      data-scene="tour"
      data-sticky={reduced ? undefined : "true"}
      aria-labelledby="tour-title"
      className="stock bg-night text-sheet relative"
      style={{ height: reduced ? "auto" : `${100 + (BUILD_STATES - 1) * 38}svh` }}
    >
      <div className={`${reduced ? "min-h-[100svh]" : "sticky top-0 h-[100svh]"} overflow-hidden`}>
        <div className="relative z-30 mx-auto grid h-full w-full max-w-[92rem] grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-4 px-5 pt-6 pb-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:grid-rows-1 md:items-center md:gap-10 md:px-10 md:py-0">
          <div
            data-slot
            className="order-1 h-full min-h-[34svh] w-full md:order-2 md:aspect-[1.45] md:h-auto"
          />

          <div className="order-2 flex min-w-0 flex-col gap-5 md:order-1 md:gap-7">
            <div className="space-y-2">
              <h2 id="tour-title" className="display text-[clamp(2.25rem,4.4vw,4rem)]">
                Watch a pair come together.
              </h2>
              <p className="text-on-night-2 hidden max-w-md text-base leading-snug md:block md:text-lg">
                A blank pair, then one part at a time: pick a material, pick a color. It&apos;s
                exactly what you do in the studio.
              </p>
            </div>

            <ol aria-label="Build sheet" className="flex flex-col">
              {BUILD_STEPS.map((step, i) => {
                const part = partOf(step.part);
                const status = i < state - 1 ? "done" : i === state - 1 ? "active" : "pending";
                return (
                  <li key={step.part}>
                    <button
                      type="button"
                      onClick={() => onJump(i + 1)}
                      aria-current={status === "active" ? "step" : undefined}
                      aria-label={`Show step ${i + 1}: ${part.label}, ${MATERIALS[step.material].label.toLowerCase()} in ${step.colorName.toLowerCase()}`}
                      className={`border-sheet/10 flex w-full cursor-pointer items-center gap-3 rounded-lg border-t px-2 py-1.5 text-left transition-colors duration-300 md:py-2 ${
                        status === "active" ? "build-active bg-volt/10" : "hover:bg-sheet/5"
                      }`}
                    >
                      <span
                        className={`spec grid size-6 shrink-0 place-items-center rounded-full border text-[0.625rem] font-bold transition-colors duration-300 ${
                          status === "active"
                            ? "border-volt bg-volt text-night"
                            : status === "done"
                              ? "border-sheet/60 text-sheet"
                              : "border-sheet/25 text-on-night-2"
                        }`}
                      >
                        {status === "done" ? (
                          <Check size={12} aria-hidden="true" />
                        ) : (
                          partNumber(partIndex(step.part))
                        )}
                      </span>
                      <span
                        className={`w-28 shrink-0 text-sm font-semibold md:w-32 ${status === "pending" ? "text-on-night-2" : ""}`}
                      >
                        {part.label}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${status === "pending" ? "text-on-night-2" : "text-sheet/85"}`}
                      >
                        {status === "pending"
                          ? "Raw"
                          : `${MATERIALS[step.material].label}, ${step.colorName}`}
                      </span>
                      <span
                        aria-hidden="true"
                        className="border-sheet/30 size-4 shrink-0 rounded-full border transition-colors duration-500"
                        style={{ background: status === "pending" ? "#ECEAE4" : step.color }}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>

            <div
              className={`flex flex-wrap items-center gap-4 transition-opacity duration-500 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
              aria-hidden={!done}
            >
              <p className="display text-[1.75rem]">Dune runner.</p>
              <Link
                href={studioHref(buildDesign(BUILD_STATES - 1))}
                tabIndex={done ? 0 : -1}
                className="bg-volt text-night group inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold"
              >
                Open this pair in the studio
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
