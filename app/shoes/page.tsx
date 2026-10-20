import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ModelCredits, ShoeGrid } from "@/components/catalog/ShoeGrid";

export const metadata: Metadata = {
  title: "Pick a pair",
  description: "Air Force 1, Air Jordan 1, Dunk Low, Gazelle, Suede, Old Skool and Chuck Taylor, ready to design in 3D.",
};

export default function ShoesPage() {
  return (
    <div className="bg-paper text-ink min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-[92rem] px-5 pt-8 pb-24 md:px-10 md:pt-14">
        <p className="spec text-ink-muted uppercase">8 silhouettes · 6 categories</p>
        <h1 id="shoes-title" className="display mt-3 text-[clamp(3.25rem,8vw,7rem)]">
          Pick a pair.
        </h1>
        <p className="text-ink-muted mt-4 max-w-xl text-lg leading-snug">
          Detailed 3D models of the classics. Choose one, then change every panel, lace and sole in the studio.
        </p>
        <div className="mt-10">
          <ShoeGrid headingId="shoes-title" />
        </div>
        <ModelCredits />
      </main>
      <SiteFooter />
    </div>
  );
}
