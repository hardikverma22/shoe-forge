"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIALS } from "@/lib/materials/presets";
import { useLanding } from "@/lib/design/landing-store";
import { studioHref } from "@/lib/design/presentation";
import { useStudioUI } from "@/lib/design/ui-store";
import { SiteHeader } from "@/components/site/SiteHeader";
import { partNumber } from "./Callouts";

/** The printed spec line along the hero's bottom rule. It prints whatever part you point at. */
function SpecLine() {
  const hovered = useStudioUI((s) => s.hoveredPart);
  const selected = useStudioUI((s) => s.selectedPart);
  const hero = useLanding((s) => s.hero);
  const id = hovered ?? selected;
  const index = forgeRunner.parts.findIndex((p) => p.id === id);
  const part = forgeRunner.parts[index];
  const cfg = part ? hero.parts[part.id] : undefined;

  return (
    <p aria-live="polite" className="spec text-night flex min-h-6 min-w-0 items-center gap-3">
      {part && cfg ? (
        <>
          <span className="bg-night text-volt grid size-6 place-items-center rounded-full font-bold">
            {partNumber(index)}
          </span>
          <span className="truncate">
            {part.label} <span className="text-on-sweep-2">/</span> {MATERIALS[cfg.material].label}{" "}
            <span className="text-on-sweep-2">/</span> {cfg.color.toUpperCase()}
          </span>
          <span
            aria-hidden="true"
            className="border-night/30 size-3 shrink-0 rounded-full border"
            style={{ background: cfg.color }}
          />
        </>
      ) : (
        <span className="text-on-sweep-2">
          <span className="hidden sm:inline">Drag to turn it. </span>Click a part to recolor it.
        </span>
      )}
    </p>
  );
}

export function Hero() {
  const hero = useLanding((s) => s.hero);

  return (
    <section
      data-scene="hero"
      aria-labelledby="hero-title"
      className="sweep text-night relative flex min-h-[100svh] touch-pan-y flex-col"
    >
      {/* Dusk: as the hero scrolls away it darkens into the tour's night stock. */}
      <div
        aria-hidden="true"
        className="hero-dusk bg-night pointer-events-none absolute inset-0 z-0 opacity-0"
      />
      <SiteHeader tone="sweep" />

      <div className="relative z-30 mx-auto grid w-full max-w-[92rem] flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] gap-6 px-5 pt-6 pb-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1 md:items-center md:px-10 md:pt-0">
        <div className="pointer-events-none flex flex-col gap-7 md:pb-16">
          {/* Each line rises out of its own mask. CSS (not JS) drives it, so it stays smooth on the
              compositor while the 3D model is still being parsed on the main thread. */}
          <h1 id="hero-title" className="hero-title display text-[clamp(4rem,10.5vw,9.5rem)]">
            {["Yours,", "part by", "part."].map((line, i) => (
              <span key={line} className="-mb-[0.06em] block overflow-hidden pb-[0.06em]">
                <span className="hero-line block" style={{ animationDelay: `${120 + i * 90}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-rise text-on-sweep-2 max-w-[30rem] text-lg leading-snug md:text-xl">
            Click any of the eight parts on a real 3D sneaker, give it real leather, suede, knit or
            patent, and make the pair nobody else has.
          </p>
          <div className="hero-rise pointer-events-auto hidden flex-wrap items-center gap-3 md:flex">
            <Link
              href={studioHref(hero)}
              className="group bg-night text-sheet inline-flex h-14 items-center gap-2 rounded-full pr-6 pl-7 text-base font-bold transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
            >
              Start designing
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <a
              href="#colorways"
              className="hover:bg-night/6 inline-flex h-14 items-center gap-2 rounded-full px-5 text-base font-semibold"
            >
              See the colorways <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Where the 3D shoe sits. The fixed canvas reads this box's position. */}
        <div data-slot className="min-h-[40svh] w-full md:aspect-[1.7] md:min-h-0" />

        <div className="hero-rise flex flex-col gap-2 pb-4 md:hidden">
          <Link
            href={studioHref(hero)}
            className="bg-night text-sheet inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-bold"
          >
            Start designing <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="relative z-30 mx-auto w-full max-w-[92rem] px-5 md:px-10">
        <div className="border-night/15 flex items-center justify-between gap-6 border-t py-4">
          <SpecLine />
          <p className="spec text-on-sweep-2 hidden shrink-0 lg:block">
            Forge Runner / 8 parts / 7 materials
          </p>
        </div>
      </div>
    </section>
  );
}
