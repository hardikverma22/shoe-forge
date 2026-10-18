"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MARKS = ["spark", "anvil", "wave", "monogram"];
const PROMPTS = [
  "Tokyo at night",
  "Desert sunrise",
  "Forest trail after rain",
  "Pastel cafe",
  "Brutalist concrete",
];

/** Types the example prompts one after another, like someone trying ideas. */
function PromptDemo() {
  const [text, setText] = useState(PROMPTS[0]!);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
    });
    if (box.current) io.observe(box.current);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      let i = 0;
      while (alive) {
        await wait(1600);
        if (!visible) continue;
        const next = PROMPTS[(i + 1) % PROMPTS.length]!;
        for (let n = PROMPTS[i % PROMPTS.length]!.length; n >= 0 && alive; n--) {
          setText(PROMPTS[i % PROMPTS.length]!.slice(0, n));
          await wait(22);
        }
        for (let n = 0; n <= next.length && alive; n++) {
          setText(next.slice(0, n));
          await wait(55);
        }
        i++;
      }
    })();
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  // Printed as a specimen (quoted prompt and caret), not as a form: it is a demonstration.
  return (
    <div ref={box} aria-hidden="true" className="flex flex-col gap-2">
      <p className="display text-volt min-h-[1.1em] text-[clamp(2rem,3.4vw,3rem)]">
        “{text}
        <span className="bg-volt ml-1 inline-block h-[0.8em] w-[3px] translate-y-[0.08em] animate-[caret_1s_steps(1)_infinite]" />
        ”
      </p>
      <p className="spec text-on-night-2">Prompt / Claude picks 8 colors and materials</p>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="spec border-sheet/30 bg-sheet/5 text-sheet inline-grid h-11 min-w-11 place-items-center rounded-lg border px-3 text-sm shadow-[inset_0_-3px_0_rgb(255_255_255/0.08)]">
      {children}
    </kbd>
  );
}

const ROWS = [
  {
    title: "Put your mark on it",
    body: "Place one of four original marks, upload your own image, or type up to twelve letters. Click the shoe to place it, then drag it along the surface.",
    demo: (
      <ul className="flex flex-wrap gap-3">
        {MARKS.map((m) => (
          <li key={m} className="bg-cobalt grid size-20 place-items-center rounded-full">
            <Image
              src={`/marks/${m}.png`}
              alt={`${m} mark`}
              width={52}
              height={52}
              className="size-13 object-contain"
            />
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Describe a colorway",
    body: "Write a few words and Claude picks a color and a material for every part, then names the pair.",
    demo: <PromptDemo />,
  },
  {
    title: "Undo anything",
    body: "A hundred steps of history, a command menu for every action, and shortcuts for parts, views and surprise colorways.",
    demo: (
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Keyboard shortcuts: Command Z, Command K, R"
      >
        <Key>⌘</Key>
        <Key>Z</Key>
        <span className="bg-sheet/25 mx-2 h-6 w-px" aria-hidden="true" />
        <Key>⌘</Key>
        <Key>K</Key>
        <span className="bg-sheet/25 mx-2 h-6 w-px" aria-hidden="true" />
        <Key>R</Key>
      </div>
    ),
  },
  {
    title: "Keep it, share it",
    body: "Save designs in your browser, share a link that rebuilds the exact pair, or download a picture up to 4× or the 3D model itself.",
    demo: (
      <ul className="spec flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem]">
        {["Share link", "PNG up to 4×", "Transparent PNG", "GLB model"].map((f, i) => (
          <li key={f} className="flex items-center gap-3">
            {i > 0 ? (
              <span aria-hidden="true" className="text-on-night-2">
                /
              </span>
            ) : null}
            {f}
          </li>
        ))}
      </ul>
    ),
  },
];

export function Capabilities() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".cap-row").forEach((row) => {
          gsap.from(row.querySelectorAll(".cap-in"), {
            y: 28,
            opacity: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: row, start: "top 82%", once: true },
          });
          gsap.from(row, {
            "--rule": 0,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: row, start: "top 85%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section
      ref={section}
      data-scene="capabilities"
      aria-labelledby="caps-title"
      className="stock bg-night text-sheet relative"
    >
      <div className="relative z-30 mx-auto max-w-[92rem] px-5 py-24 md:px-10 md:py-36">
        <h2
          id="caps-title"
          className="display mb-14 max-w-4xl text-[clamp(3rem,7vw,6.5rem)] md:mb-20"
        >
          A whole studio, <span className="text-volt">not a color picker.</span>
        </h2>
        <ul>
          {ROWS.map((r) => (
            <li
              key={r.title}
              className="cap-row relative grid gap-5 py-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-10 md:py-12"
              style={{ "--rule": 1 } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className="bg-sheet/25 absolute inset-x-0 top-0 h-px origin-left"
                style={{ transform: "scaleX(var(--rule))" }}
              />
              <h3 className="cap-in display text-[2.5rem] md:text-[3.25rem]">{r.title}</h3>
              <p className="cap-in text-on-night-2 max-w-md text-base leading-relaxed md:text-lg">
                {r.body}
              </p>
              <div className="cap-in">{r.demo}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
