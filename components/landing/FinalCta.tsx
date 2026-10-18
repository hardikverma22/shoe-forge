"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanding } from "@/lib/design/landing-store";
import { studioHref } from "@/lib/design/presentation";

export function FinalCta() {
  const hero = useLanding((s) => s.hero);
  return (
    <section
      data-scene="final"
      aria-labelledby="final-title"
      className="bg-volt text-night relative overflow-hidden"
    >
      <div className="relative z-30 mx-auto grid min-h-[100svh] max-w-[92rem] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-6 px-5 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:grid-rows-1 md:items-center md:px-10">
        <div className="flex flex-col gap-8">
          <h2 id="final-title" className="display text-[clamp(4rem,10vw,9.5rem)]">
            Your pair
            <br />
            is waiting.
          </h2>
          <p className="text-night/80 max-w-md text-lg leading-snug">
            The colors you picked up top come with you. No account, nothing to install. Just the
            studio.
          </p>
          <div>
            <Link
              href={studioHref(hero)}
              className="group bg-night text-volt inline-flex h-16 items-center gap-3 rounded-full pr-7 pl-8 text-lg font-bold transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1"
            >
              Start designing
              <ArrowUpRight
                size={20}
                aria-hidden="true"
                className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
        <div data-slot className="min-h-[36svh] w-full md:aspect-[1.5] md:min-h-0" />
      </div>
    </section>
  );
}
