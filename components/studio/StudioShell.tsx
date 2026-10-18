"use client";

import dynamic from "next/dynamic";
import { useSearchParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDesignStore, history } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { defaultDesign } from "@/lib/design/defaults";
import { decodeDesign, encodeDesign } from "@/lib/design/codec";
import { getSavedDesign } from "@/lib/design/saved";
import { maxGraphics } from "@/lib/design/rules";
import { generateColorway } from "@/lib/design/colorways";
import { getProduct } from "@/lib/products";
import type { Graphic } from "@/lib/design/types";
import { createHistoryGesture, type HistoryGesture } from "@/lib/design/gesture";
import * as THREE from "three";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { useSceneMeta } from "@/lib/three/scene-store";
import { GraphicDecal } from "@/components/three/PartGraphics";
import { SceneCapture } from "@/components/three/SceneCapture";
import { LoadingOverlay } from "./LoadingOverlay";
import { Toolbar } from "./Toolbar";
import { SidePanel } from "./SidePanel";
import { ViewBar } from "./ViewBar";
import { CommandMenu, ShortcutsDialog } from "./CommandMenu";
import { PartRail, pickPart } from "./PartRail";
import { StudioCallout, SpecReadout } from "./StudioCallout";
import { Toaster } from "@/components/ui/Toaster";
import type { SurfaceEvent, SurfaceKind } from "@/components/three/ProductModel";

const StudioCanvas = dynamic(() => import("@/components/three/StudioCanvas"), { ssr: false });

const ACCENT = { light: "#1E2BFF", dark: "#D7FF3A" };
const DEFAULT_GRAPHIC_SCALE = 0.2;
const ZONE_HINT = "Graphics go on the upper or the heel patch.";

export function StudioShell({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const params = useSearchParams();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const design = useDesignStore((s) => s.design);
  const selectedGraphic = useStudioUI((s) => s.selectedGraphic);
  const placing = useStudioUI((s) => s.placing);
  const layoutReady = useSceneMeta((s) => s.layout !== null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const writtenRef = useRef<string | null>(null);
  const accent = resolvedTheme === "dark" ? ACCENT.dark : ACCENT.light;

  // A fresh studio: forget the scene and selection left over from another page.
  useEffect(() => {
    useSceneMeta.getState().setLayout(null);
    useStudioUI.getState().set({
      selectedPart: "upper",
      hoveredPart: null,
      placing: null,
      selectedGraphic: null,
      view: null,
      dragging: false,
    });
  }, []);

  // Load the design once: from a share link, from the gallery, or the default.
  useEffect(() => {
    if (!product) return;
    const key = `${product.id}|${params.get("d") ?? ""}|${params.get("saved") ?? ""}`;
    if (loadedFor.current === key) return;
    // Our own URL sync below changes ?d=; that is not a new design to load (and must not
    // wipe the undo history).
    // ("+" in the encoded design reads back as a space from the query string.)
    if (params.get("d") && params.get("d")!.replace(/ /g, "+") === writtenRef.current) {
      loadedFor.current = key;
      return;
    }
    loadedFor.current = key;
    const d = params.get("d");
    const savedId = params.get("saved");
    if (d) {
      const decoded = decodeDesign(d);
      if (decoded && decoded.productId === product.id) {
        useDesignStore.getState().load(decoded);
      } else {
        toast.error("That design link is invalid. Showing the default design.");
        useDesignStore.getState().load(defaultDesign(product));
      }
    } else if (savedId) {
      getSavedDesign(savedId).then((rec) => {
        if (rec && rec.design.productId === product.id) useDesignStore.getState().load(rec.design);
        else useDesignStore.getState().load(defaultDesign(product));
        history.clear();
      });
      return;
    } else {
      useDesignStore.getState().load(defaultDesign(product));
    }
    history.clear();
  }, [product, params]);

  // Keep the URL in sync so refresh and copy-link always reflect the current design.
  useEffect(() => {
    if (!design) return;
    const id = setTimeout(() => {
      const { value } = encodeDesign(design);
      writtenRef.current = value;
      const next = `${pathname}?d=${value}`;
      if (window.location.pathname + window.location.search !== next) {
        window.history.replaceState(null, "", next);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [design, pathname]);

  // Text graphics loaded from a link have no image yet: render them now.
  useEffect(() => {
    if (!design || !product) return;
    const missing = design.graphics.filter((g) => g.kind === "text" && !g.src && g.text);
    if (missing.length === 0) return;
    import("@/lib/graphics/text").then(async ({ textToDataUrl, fontFor }) => {
      for (const g of missing) {
        const f = fontFor(g.font);
        const src = await textToDataUrl(g.text!, f.family, g.color ?? "#1B1B1F", f.condensed);
        useDesignStore.getState().updateGraphic(g.id, { src });
      }
    });
  }, [design, product]);

  // ----- Surface interaction: placing and dragging graphics -----
  const drag = useRef<{ id: string; gesture: HistoryGesture<Graphic> } | null>(null);

  const localPoint = (e: SurfaceEvent) => {
    const local = e.object.worldToLocal(e.point.clone());
    const n = e.face ? e.face.normal.clone().normalize() : new THREE.Vector3(0, 0, 1);
    return {
      position: [local.x, local.y, local.z] as [number, number, number],
      normal: [n.x, n.y, n.z] as [number, number, number],
    };
  };

  const onSurface = useCallback(
    (kind: SurfaceKind, partId: string, e: SurfaceEvent) => {
      if (!product) return;
      const ui = useStudioUI.getState();
      const store = useDesignStore.getState();

      if (kind === "click" && ui.placing) {
        if (!product.graphicZones.includes(partId)) {
          toast.info(ZONE_HINT);
          return;
        }
        const max = maxGraphics(product);
        const count = store.design?.graphics.length ?? 0;
        if (count >= max) {
          toast.error(`You can add up to ${max} graphics`);
          ui.set({ placing: null });
          return;
        }
        const { position, normal } = localPoint(e);
        const id = crypto.randomUUID();
        const g: Graphic = {
          id,
          kind: ui.placing.kind,
          src: ui.placing.src,
          text: ui.placing.text,
          font: ui.placing.font,
          color: ui.placing.color,
          partId,
          position,
          normal,
          rotation: 0,
          scale: DEFAULT_GRAPHIC_SCALE,
        };
        const err = store.addGraphic(product, g);
        if (err) toast.error(err);
        else {
          ui.set({ placing: null, selectedGraphic: id, selectedPart: partId });
          track("graphic_added", { kind: g.kind, part: partId });
        }
        return;
      }

      if (kind === "down" && ui.selectedGraphic) {
        const g = store.design?.graphics.find((x) => x.id === ui.selectedGraphic);
        if (g && g.partId === partId) {
          const gesture = createHistoryGesture<Graphic>((v) =>
            useDesignStore
              .getState()
              .updateGraphic(v.id, { position: v.position, normal: v.normal }),
          );
          drag.current = { id: g.id, gesture };
          gesture.onStart(g);
          ui.set({ dragging: true });
        }
        return;
      }

      if (kind === "move" && drag.current) {
        const { position, normal } = localPoint(e);
        const current = useDesignStore
          .getState()
          .design?.graphics.find((x) => x.id === drag.current!.id);
        if (current) drag.current.gesture.onChange({ ...current, position, normal });
        return;
      }

      if (kind === "up" && drag.current) {
        const { position, normal } = localPoint(e);
        const current = useDesignStore
          .getState()
          .design?.graphics.find((x) => x.id === drag.current!.id);
        if (current) drag.current.gesture.onEnd({ ...current, position, normal });
        drag.current = null;
        ui.set({ dragging: false });
      }
    },
    [product],
  );

  // A pointer released outside the model still ends a drag.
  useEffect(() => {
    const end = () => {
      if (drag.current) {
        drag.current = null;
        useStudioUI.getState().set({ dragging: false });
        history.resume();
      }
    };
    window.addEventListener("pointerup", end);
    return () => window.removeEventListener("pointerup", end);
  }, []);

  // Keyboard shortcuts. Ignored while typing in a field.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();

      if (mod && k === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
        return;
      }
      if (typing) return;
      if (mod && k === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        return;
      }
      if ((mod && k === "z" && e.shiftKey) || (mod && k === "y")) {
        e.preventDefault();
        history.redo();
        return;
      }
      if (mod && k === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sf:save"));
        return;
      }
      if (mod) return;

      const ui = useStudioUI.getState();
      const parts = product.parts.map((p) => p.id);
      if (k === "[" || k === "]") {
        const idx = parts.indexOf(ui.selectedPart ?? "");
        const next =
          parts[(idx + (k === "]" ? 1 : parts.length - 1) + parts.length) % parts.length] ??
          parts[0];
        if (next) pickPart(next);
      } else if (/^[1-6]$/.test(k)) {
        const v = product.cameraViews[Number(k) - 1];
        if (v) ui.set({ view: v.id, cameraNonce: ui.cameraNonce + 1 });
      } else if (k === "r") {
        useDesignStore.getState().applyParts(generateColorway(product));
        toast.success("Surprise colorway applied");
        track("color_changed", { source: "surprise" });
      } else if (k === " ") {
        e.preventDefault();
        ui.set({ autoRotate: !ui.autoRotate });
      } else if (k === "delete" || k === "backspace") {
        if (ui.selectedGraphic) {
          useDesignStore.getState().removeGraphic(ui.selectedGraphic);
          ui.set({ selectedGraphic: null });
        }
      } else if (k === "escape") {
        ui.set({ placing: null, selectedGraphic: null });
      } else if (k === "?") {
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product]);

  const decals = useCallback(
    (partId: string) => {
      const graphics = useDesignStore.getState().design?.graphics ?? design?.graphics ?? [];
      return (
        graphics
          .filter((g) => g.partId === partId && g.src)
          // Each decal suspends on its own texture, so the rest of the scene never blinks out.
          .map((g) => (
            <Suspense key={g.id} fallback={null}>
              <GraphicDecal graphic={g} selected={selectedGraphic === g.id} accent={accent} />
            </Suspense>
          ))
      );
    },
    [design, selectedGraphic, accent],
  );

  const overlay = useMemo(() => <SceneCapture />, []);

  if (!product) return null;

  const zones = product.parts
    .filter((p) => product.graphicZones.includes(p.id))
    .map((p) => p.label.toLowerCase());

  return (
    <div className="bg-paper flex h-dvh flex-col overflow-hidden">
      <Toolbar product={product} onCommand={() => setCommandOpen(true)} />

      <div className="relative flex min-h-0 flex-1">
        {design ? <PartRail product={product} design={design} /> : null}

        <main aria-label="Shoe studio" className="studio-sweep relative min-w-0 flex-1">
          <div
            className={`absolute inset-x-0 top-0 transition-[bottom] duration-500 ease-[var(--ease-out-expo)] lg:bottom-0 ${sheetOpen ? "bottom-[64dvh]" : "bottom-[8.75rem]"}`}
          >
            {design ? (
              <StudioCanvas
                product={product}
                design={design}
                accent={accent}
                label={`${product.name} with a ${design.parts.upper?.material ?? "leather"} upper in ${design.parts.upper?.color ?? ""}. Use the parts list and the panel to change it.`}
                overlay={overlay}
                onSurface={onSurface}
                controlsEnabled
              >
                {decals}
              </StudioCanvas>
            ) : null}
            <LoadingOverlay />
            {design && layoutReady ? (
              <>
                <StudioCallout product={product} design={design} />
                {placing ? (
                  <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-4">
                    <p
                      role="status"
                      className="bg-ink text-paper flex items-center gap-3 rounded-full py-2 pr-2 pl-4 text-sm font-semibold shadow-lg"
                    >
                      Click the {zones.join(", ")} to place it
                      <button
                        type="button"
                        onClick={() => useStudioUI.getState().set({ placing: null })}
                        className="bg-paper/15 hover:bg-paper/25 rounded-full px-3 py-1 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </p>
                  </div>
                ) : null}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 p-3 lg:p-4">
                  <SpecReadout product={product} design={design} />
                  <ViewBar product={product} />
                </div>
              </>
            ) : null}
          </div>
        </main>

        {design ? (
          <SidePanel
            product={product}
            design={design}
            open={sheetOpen}
            onToggle={() => setSheetOpen((o) => !o)}
          />
        ) : null}
      </div>

      <CommandMenu
        product={product}
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Toaster />
    </div>
  );
}
