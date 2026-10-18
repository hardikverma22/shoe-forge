"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { forgeRunner } from "@/lib/products/forge-runner";
import { MATERIAL_LIST } from "@/lib/materials/presets";
import { toast } from "@/lib/toast";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const LandingScene = dynamic(() => import("./LandingScene"), { ssr: false, loading: () => null });

const SNIPPET = `<div id="configurator"></div>
<script src="https://YOUR-SITE/embed.js"></script>
<script>
  ShoeForge.mount(document.getElementById("configurator"), { product: "forge-runner" });
</script>`;

const CAPABILITIES = [
  { title: "Any shoe, one config file", body: "Add a product with a GLB model and one typed config. Parts, materials, rules and price live in one place." },
  { title: "Rules your factory can live with", body: "Forbid materials per part and cap graphics. Blocked options explain themselves instead of failing at checkout." },
  { title: "A tech pack with every order", body: "Part, material, HEX and price for every piece, ready for a production floor." },
  { title: "Events for your analytics", body: "Every change, share and add-to-bag is an event. Subscribe in one line." },
];

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const explode = useRef(0);
  const [reduced, setReduced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [labelsOn, setLabelsOn] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Hero: each headline line rises out of a mask once.
      const split = SplitText.create(".hero-title", { type: "lines", mask: "lines", linesClass: "line" });
      gsap.from(split.lines, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.08, delay: 0.1 });
      gsap.from(".hero-sub, .hero-cta", { opacity: 0, y: 14, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.6 });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Pinned section: scrolling explodes the shoe into its parts, then reassembles it.
        ScrollTrigger.create({
          trigger: pin.current,
          start: "top top",
          end: "bottom bottom",
          pin: ".pin-stage",
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            // hold assembled, explode, hold exploded, reassemble
            explode.current = p < 0.15 ? 0 : p < 0.55 ? (p - 0.15) / 0.4 : p < 0.8 ? 1 : Math.max(0, 1 - (p - 0.8) / 0.2);
            setLabelsOn(explode.current > 0.6);
          },
        });
        return () => undefined;
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        explode.current = 0.7;
        setLabelsOn(true);
      });

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {/* One fixed 3D layer on the right half. It stays on screen while the page scrolls. */}
      <div aria-hidden={false} className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-full md:block lg:w-1/2">
        <LandingScene explodeRef={explode} />
      </div>
      <div className="relative z-10">
      <SiteHeader />
      <main>
        <section className="relative mx-auto grid min-h-[92dvh] max-w-7xl items-center gap-10 px-5 py-12 md:px-10">
          <div className="relative z-10 space-y-8">
            <h1 className="hero-title font-display text-[clamp(4.5rem,13vw,12rem)] leading-[0.86] font-black tracking-[-0.015em]">
              Build your
              <br />
              pair.
            </h1>
            <p className="hero-sub max-w-md text-lg text-ink-muted">
              Design a sneaker in real-time 3D, see it on your floor, and download the tech pack to make it.
            </p>
            <div className="hero-cta flex flex-wrap items-center gap-5">
              <Link href="/studio/forge-runner" className="inline-flex items-center rounded-[var(--radius-control)] bg-accent px-6 py-3 font-semibold text-accent-ink transition-transform hover:scale-[1.03]">
                Start designing
              </Link>
              <a href="#brands" className="text-sm font-semibold underline underline-offset-4">
                Embed it in your store
              </a>
            </div>
          </div>
        </section>

        <section ref={pin} className="relative" aria-labelledby="explode-heading" style={{ height: reduced ? "auto" : "260vh" }}>
          <div className="pin-stage flex min-h-[90dvh] items-center">
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 md:px-10 lg:max-w-[46%] lg:pl-10">
              <div className="space-y-5">
                <h2 id="explode-heading" className="font-display text-6xl font-black">Eight pieces.<br />One pair.</h2>
                <p className="max-w-md text-ink-muted">
                  Every part has its own material, color and price. Scroll to take the shoe apart.
                </p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {forgeRunner.parts.map((p, i) => (
                    <li key={p.id} className="flex items-baseline gap-3 border-b border-line py-2" style={{ opacity: labelsOn || reduced ? 1 : 0.35, transition: "opacity 400ms" }}>
                      <span className="tabular w-5 text-ink-muted">{String(i + 1)}</span>
                      <span className="font-semibold">{p.label}</span>
                      <span className="ml-auto text-ink-muted">{p.allowedMaterials.length} {p.allowedMaterials.length === 1 ? "material" : "materials"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="materials" aria-labelledby="materials-heading" className="mx-auto max-w-7xl space-y-8 px-5 py-20 md:px-10">
          <h2 id="materials-heading" className="font-display text-6xl font-black">Seven materials. Real surfaces.</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MATERIAL_LIST.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                className={`rounded-[var(--radius-panel)] border border-line bg-surface p-5 ${i === 0 ? "lg:row-span-2" : ""}`}
              >
                <p className="font-display text-3xl font-extrabold">{m.label}</p>
                <p className="mt-2 text-sm text-ink-muted">{m.description}</p>
              </motion.li>
            ))}
          </ul>
        </section>

        <section id="brands" aria-labelledby="brands-heading" className="mx-auto max-w-7xl space-y-10 px-5 py-20 md:px-10">
          <h2 id="brands-heading" className="font-display text-6xl font-black">Put it on your store.</h2>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
            {CAPABILITIES.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={`rounded-[var(--radius-panel)] border border-line bg-surface p-6 ${i === 0 ? "lg:row-span-2" : ""}`}
              >
                <h3 className="font-display text-2xl font-extrabold">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{c.body}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative">
              <pre tabIndex={0} aria-label="Embed snippet" className="overflow-x-auto rounded-[var(--radius-panel)] bg-ink p-5 text-sm leading-relaxed text-paper">
                <code>{SNIPPET}</code>
              </pre>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(SNIPPET);
                  setCopied(true);
                  toast.success("Snippet copied");
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="aspect-[16/10] overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
              <iframe title="Live example of the embedded configurator" src="/embed/forge-runner?theme=light" loading="lazy" className="size-full border-0" />
            </div>
          </div>
          <Link href="/docs" className="inline-block text-sm font-semibold underline underline-offset-4">
            Read the embed docs
          </Link>
        </section>

        <section aria-labelledby="colorways-h" className="mx-auto max-w-7xl space-y-6 px-5 pb-20 md:px-10">
          <h2 id="colorways-h" className="font-display text-4xl font-extrabold">Start from a colorway</h2>
          <ul tabIndex={0} aria-label="Colorways, scroll sideways" className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:-mx-10 md:px-10">
            {forgeRunner.colorways.map((c) => (
              <li key={c.id} className="snap-start">
                <Link href="/gallery" className="block w-56 rounded-[var(--radius-panel)] border border-line bg-surface p-5 hover:border-accent">
                  <p className="font-display text-2xl font-extrabold">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{c.story}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
      </div>
    </div>
  );
}
