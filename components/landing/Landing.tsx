"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { forgeRunner } from "@/lib/products/forge-runner";
import { useLanding } from "@/lib/design/landing-store";
import { useStudioUI } from "@/lib/design/ui-store";
import { useSceneMeta } from "@/lib/three/scene-store";
import { rig, setPose, type Pose } from "@/lib/three/landing-rig";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Callouts } from "./Callouts";
import { Hero } from "./Hero";
import { Tour, BUILD_STATES, BUILD_YAW, buildAt } from "./Tour";
import { BUILD_STEPS } from "@/lib/design/landing-store";
import { Materials } from "./Materials";
import { Colorways, colorwayAt, COLORWAY_COUNT } from "./Colorways";
import { Capabilities } from "./Capabilities";
import { Lineup } from "./Lineup";
import { FinalCta } from "./FinalCta";
import { IntroLoader } from "./IntroLoader";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LandingScene = dynamic(() => import("./LandingScene"), { ssr: false, loading: () => null });

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const OFFSCREEN: Partial<Pose> = { cy: -0.8, callouts: 0, spin: 0 };

/** Where a section's shoe slot sits on screen, as a pose. */
function slotPose(slot: Element | null): Partial<Pose> | null {
  if (!slot) return null;
  const r = slot.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (r.width === 0) return null;
  return {
    cx: (r.left + r.width / 2) / W,
    cy: (r.top + r.height / 2) / H,
    // Fit the shoe's length to the slot's width, but never taller than the slot (a side view is about 2:1).
    size: Math.min(r.width * 0.84, r.height * 1.55) / Math.min(W, H * 1.6),
  };
}

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const [reduced, setReduced] = useState(false);
  // False while the intro loader covers the page: the hero's entrance and scrolling wait for it.
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);
  const reveal = useCallback(() => {
    revealedRef.current = true;
    setRevealed(true);
    window.scrollTo(0, 0);
    lenis.current?.scrollTo(0, { immediate: true });
    lenis.current?.start();
  }, []);
  const ready = useSceneMeta((s) => s.layout !== null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mq.matches);
      rig.instant = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    useStudioUI.getState().set({ selectedPart: null, hoveredPart: null });
    return () => mq.removeEventListener("change", apply);
  }, []);

  /** Reads which section owns the viewport and points the 3D rig at its slot. */
  const choreograph = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const H = window.innerHeight;
    let active: HTMLElement | null = null;
    for (const s of el.querySelectorAll<HTMLElement>("[data-scene]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= H * 0.5 && r.bottom > H * 0.5) {
        active = s;
        break;
      }
    }
    if (!active) return;
    const r = active.getBoundingClientRect();
    const sticky = active.dataset.sticky === "true";
    const p = sticky
      ? clamp01(-r.top / Math.max(1, r.height - H))
      : clamp01(-r.top / Math.max(1, r.height));
    const base = slotPose(active.querySelector("[data-slot]")) ?? {};
    const landing = useLanding.getState();
    let showing = "hero";

    rig.compact = false;
    rig.interactive = false;
    rig.only = null;
    let tourPart: string | null = null;
    rig.lineColor = active.dataset.scene === "tour" ? "#ffffff" : "#0a0a12";
    switch (active.dataset.scene) {
      case "hero":
        setPose({ ...base, yaw: -0.5, explode: 0, spin: 0, callouts: p < 0.55 ? 1 : 0 });
        rig.interactive = p < 0.5;
        break;
      case "tour": {
        // The pair is built one part at a time; the callout points at the part just made.
        const state = sticky ? buildAt(p) : landing.tourIndex;
        const part = state > 0 ? BUILD_STEPS[state - 1]!.part : null;
        landing.setTour(state, part);
        tourPart = part;
        showing = `build:${state}`;
        setPose({
          ...base,
          yaw: BUILD_YAW[state] ?? -0.45,
          explode: 0,
          spin: 0,
          callouts: part ? 1 : 0,
        });
        rig.only = part;
        rig.compact = false;
        break;
      }
      case "colorways": {
        const index = sticky ? colorwayAt(p) : landing.colorwayIndex;
        landing.setColorwayIndex(index);
        showing = forgeRunner.colorways[index]?.id ?? "hero";
        setPose({ ...base, yaw: -0.45, explode: 0, spin: reduced ? 0 : 0.35, callouts: 0 });
        break;
      }
      case "final":
        // The visitor's own pair returns with its part numbers: the colors picked up top come along.
        setPose({ ...base, yaw: -0.55, explode: 0, spin: 0, callouts: p < 0.6 ? 1 : 0 });
        rig.compact = true;
        break;
      default:
        setPose(OFFSCREEN);
    }
    landing.setShowing(showing);
    if (!tourPart) landing.setTour(landing.tourIndex, null);
  }, [reduced]);

  // Smooth scrolling, wired into GSAP's ticker so ScrollTrigger and the rig share one clock.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== last) rig.direction = y > last ? 1 : -1;
      last = y;
      choreograph();
    };
    let tick: ((time: number) => void) | null = null;
    if (!reduced) {
      const l = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 0.95 });
      lenis.current = l;
      if (!revealedRef.current) l.stop();
      l.on("scroll", ScrollTrigger.update);
      tick = (time: number) => l.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", choreograph);
    choreograph();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", choreograph);
      if (tick) gsap.ticker.remove(tick);
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, [reduced, choreograph]);

  // Fonts and the model change layout once; re-measure when they land.
  useEffect(() => {
    if (!ready) return;
    choreograph();
    ScrollTrigger.refresh();
  }, [ready, choreograph]);

  // The hero darkens into the night of the tour as it scrolls away.
  useGSAP(
    () => {
      if (reduced) return;
      gsap.to(".hero-dusk", {
        opacity: 1,
        ease: "power1.in",
        scrollTrigger: {
          trigger: '[data-scene="hero"]',
          start: "35% top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  // The shoe's entrance waits for the intro loader to lift (sf:intro-go), which itself waits until
  // the scene has compiled its shaders and uploaded its textures, so the first frames are smooth.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rig.intro = 1;
      return;
    }
    rig.intro = 0;
    rig.sceneReady = false;
    let tween: gsap.core.Tween | null = null;
    const start = () => {
      tween = gsap.to(rig, { intro: 1, duration: 1.7, ease: "expo.out", delay: 0.05 });
    };
    window.addEventListener("sf:intro-go", start, { once: true });
    return () => {
      window.removeEventListener("sf:intro-go", start);
      tween?.kill();
    };
  }, []);

  // Drag to turn the shoe in the hero; the pointer also tilts it slightly.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let start: { x: number; y: number; id: number } | null = null;
    let lastX = 0;
    const isControl = (t: EventTarget | null) =>
      Boolean(
        (t as HTMLElement | null)?.closest?.("a,button,input,textarea,select,[data-no-pick]"),
      );
    const nearShoe = (x: number, y: number) => {
      const b = rig.bounds;
      return x > b.left - 60 && x < b.right + 60 && y > b.top - 60 && y < b.bottom + 60;
    };
    const down = (e: PointerEvent) => {
      if (!rig.interactive || isControl(e.target) || !nearShoe(e.clientX, e.clientY)) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      lastX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!rig.dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        rig.dragging = true;
        useStudioUI.getState().set({ hoveredPart: null });
        document.body.style.cursor = "grabbing";
      }
      if (rig.dragging) {
        rig.dragYaw += (e.clientX - lastX) * 0.011;
        lastX = e.clientX;
      }
    };
    const up = () => {
      if (rig.dragging) {
        rig.justDragged = true;
        setTimeout(() => (rig.justDragged = false), 60);
        document.body.style.cursor = "";
      }
      rig.dragging = false;
      start = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  /** Scrolls a pinned section to stop i of n (or sets it directly under reduced motion). */
  const jumpTo = useCallback(
    (selector: string, i: number, n: number, fallback: () => void) => {
      const sec = document.querySelector<HTMLElement>(selector);
      if (reduced || !sec) {
        fallback();
        choreograph();
        return;
      }
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const span = sec.offsetHeight - window.innerHeight;
      const y = top + (span * (i + 0.5)) / n;
      if (lenis.current) lenis.current.scrollTo(y, { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: "auto" });
    },
    [reduced, choreograph],
  );
  const jumpToTour = useCallback(
    (i: number) =>
      jumpTo('[data-scene="tour"]', i, BUILD_STATES, () =>
        useLanding.getState().setTour(i, i > 0 ? BUILD_STEPS[i - 1]!.part : null),
      ),
    [jumpTo],
  );

  const jumpToColorway = useCallback(
    (i: number) =>
      jumpTo("#colorways", i, COLORWAY_COUNT, () => useLanding.getState().setColorwayIndex(i)),
    [jumpTo],
  );

  return (
    <div ref={root} className="relative" data-intro={revealed ? "go" : "wait"}>
      <IntroLoader onReveal={reveal} />
      <div
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-1000"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <LandingScene eventSource={root} />
      </div>
      <Callouts />

      <main>
        <Hero />
        <Tour reduced={reduced} onJump={jumpToTour} />
        <Materials />
        <Colorways reduced={reduced} onJump={jumpToColorway} />
        <Lineup />
        <Capabilities />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
