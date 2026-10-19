import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ShoeGrid } from "@/components/catalog/ShoeGrid";

/** The brand lineup on the home page: the 3D pair steps aside for detailed 3D models of the classics. */
export function Lineup() {
  return (
    <section data-scene="lineup" aria-labelledby="lineup-title" className="force-light bg-paper text-ink relative z-30">
      <div className="mx-auto max-w-[92rem] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="spec text-ink-muted uppercase">The lineup</p>
            <h2 id="lineup-title" className="display mt-3 text-[clamp(3rem,7.5vw,7rem)]">
              Or start from
              <br />
              an icon.
            </h2>
          </div>
          <div className="max-w-sm space-y-4">
            <p className="text-ink-muted text-lg leading-snug">
              Air Force 1, Jordan 1, Dunk, Superstar, Gazelle, Suede, Old Skool and Chuck. Every panel is yours to recolor.
            </p>
            <Link href="/shoes" className="group inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline">
              See all shoes
              <ArrowUpRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
        <div className="mt-12">
          <ShoeGrid headingId="lineup-title" />
        </div>
      </div>
    </section>
  );
}
