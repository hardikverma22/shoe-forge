import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="stock bg-night text-sheet relative z-10">
      <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-10">
        <div className="space-y-4">
          <Logo />
          <p className="text-on-night-2 max-w-sm text-sm">
            A sneaker you design part by part, in real-time 3D. Built by Hardik Verma.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm font-semibold">
          <Link className="hover:text-volt w-fit" href="/studio/forge-runner">
            Studio
          </Link>
          <Link className="hover:text-volt w-fit" href="/gallery">
            My designs
          </Link>
          <a className="hover:text-volt w-fit" href="https://github.com/hardikverma22/shoe-forge">
            Source on GitHub
          </a>
        </nav>
        <p className="spec text-on-night-2 max-w-xs leading-relaxed">
          Textures: ambientCG, CC0 1.0. Fonts: Archivo and Martian Mono, OFL. No real brand names or
          marks are used.
        </p>
      </div>
    </footer>
  );
}
