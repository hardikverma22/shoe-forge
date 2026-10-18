import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <div className="sweep text-night flex min-h-dvh flex-col">
      <SiteHeader tone="sweep" />
      <main className="mx-auto flex w-full max-w-[92rem] flex-1 flex-col items-start justify-center gap-6 px-5 pb-24 md:px-10">
        <h1 className="display text-[clamp(4rem,12vw,10rem)]">Page not found.</h1>
        <p className="text-on-sweep-2 max-w-md text-lg">
          That page doesn&apos;t exist, or the design link is broken.
        </p>
        <Link
          className="bg-volt text-night inline-flex h-14 items-center rounded-full px-7 font-bold"
          href="/"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
