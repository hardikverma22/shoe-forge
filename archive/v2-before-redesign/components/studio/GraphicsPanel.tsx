"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design, Graphic } from "@/lib/design/types";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { maxGraphics } from "@/lib/design/rules";
import { useHistoryGesture } from "@/lib/design/gesture";
import { toast } from "@/lib/toast";
import { Button, Slider } from "@/components/ui/primitives";

const MARKS = ["anvil", "spark", "wave", "monogram"] as const;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export function GraphicsPanel({ product, design }: { product: ProductDef; design: Design }) {
  const placing = useStudioUI((s) => s.placing);
  const selectedGraphic = useStudioUI((s) => s.selectedGraphic);
  const max = maxGraphics(product);
  const used = design.graphics.length;
  const full = used >= max;

  const startPlacing = (p: NonNullable<typeof placing>) => {
    if (full) {
      toast.error(`You can add up to ${max} graphics`);
      return;
    }
    useStudioUI.getState().set({ placing: p, selectedPart: null });
    toast.info(`Click ${product.parts.filter((x) => product.graphicZones.includes(x.id)).map((x) => x.label).join(", ")} to place it`);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        {used} of {max} graphics used.{" "}
        {placing ? (
          <button type="button" className="underline underline-offset-4" onClick={() => useStudioUI.getState().set({ placing: null })}>
            Cancel placing
          </button>
        ) : null}
      </p>

      <section aria-labelledby="marks-heading" className="space-y-2">
        <h3 id="marks-heading" className="font-semibold">
          Marks
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {MARKS.map((m) => (
            <button
              key={m}
              type="button"
              aria-label={`Place the ${m} mark`}
              disabled={full}
              onClick={() => startPlacing({ kind: "mark", src: `/marks/${m}.png` })}
              className="grid aspect-square place-items-center rounded-[var(--radius-control)] border border-line bg-ink/80 p-2 transition-transform hover:scale-105 disabled:opacity-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/marks/${m}.png`} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      </section>

      <UploadSection onReady={(src) => startPlacing({ kind: "upload", src })} disabled={full} />
      <TextSection onReady={(p) => startPlacing(p)} disabled={full} palette={product.palette} />

      {design.graphics.length > 0 ? (
        <section aria-labelledby="placed-heading" className="space-y-3 border-t border-line pt-5">
          <h3 id="placed-heading" className="font-semibold">
            On the shoe
          </h3>
          <ul className="space-y-2">
            {design.graphics.map((g) => (
              <PlacedGraphic key={g.id} graphic={g} label={product.parts.find((p) => p.id === g.partId)?.label ?? g.partId} selected={selectedGraphic === g.id} />
            ))}
          </ul>
          <p className="text-xs text-ink-muted">Drag a selected graphic along the shoe. Press Delete to remove it.</p>
        </section>
      ) : null}
    </div>
  );
}

function UploadSection({ onReady, disabled }: { onReady: (src: string) => void; disabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="upload-heading" className="space-y-2">
      <h3 id="upload-heading" className="font-semibold">
        Upload
      </h3>
      <label className="flex cursor-pointer flex-col gap-2 rounded-[var(--radius-control)] border border-dashed border-line p-4 text-sm hover:border-accent">
        <span className="font-medium">Choose an image</span>
        <span className="text-ink-muted">PNG, JPG or SVG, up to 2 MB</span>
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!ALLOWED_TYPES.includes(file.type)) {
              setError("That file type isn't supported. Use PNG, JPG or SVG.");
              return;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
              setError("That file is over 2 MB. Try a smaller image.");
              return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onload = () => onReady(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function TextSection({ onReady, disabled, palette }: { onReady: (p: { kind: "text"; src: string; text: string; font: string; color: string }) => void; disabled: boolean; palette: string[] }) {
  const [text, setText] = useState("");
  const [font, setFont] = useState<"display" | "sans">("display");
  const [color, setColor] = useState(palette[2] ?? "#2B3CFF");
  const [busy, setBusy] = useState(false);

  return (
    <section aria-labelledby="text-heading" className="space-y-3">
      <h3 id="text-heading" className="font-semibold">
        Text
      </h3>
      <div className="flex gap-2">
        <label htmlFor="graphic-text" className="sr-only">
          Text to print, 12 characters at most
        </label>
        <input
          id="graphic-text"
          value={text}
          maxLength={12}
          onChange={(e) => setText(e.target.value)}
          placeholder="Up to 12 letters"
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm outline-none focus-visible:border-accent"
        />
        <select
          aria-label="Font"
          value={font}
          onChange={(e) => setFont(e.target.value as "display" | "sans")}
          className="h-10 rounded-[var(--radius-control)] border border-line bg-paper px-2 text-sm"
        >
          <option value="display">Display</option>
          <option value="sans">Sans</option>
        </select>
      </div>
      <div role="radiogroup" aria-label="Text color" className="flex flex-wrap gap-2">
        {palette.slice(0, 8).map((hex) => (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={color === hex}
            aria-label={`Text color ${hex}`}
            onClick={() => setColor(hex)}
            className={`size-7 rounded-full border ${color === hex ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "border-line"}`}
            style={{ background: hex }}
          />
        ))}
      </div>
      <Button
        disabled={!text.trim() || disabled || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const { textToDataUrl } = await import("@/lib/graphics/text");
            const family = getComputedStyle(document.documentElement).getPropertyValue(font === "display" ? "--font-big-shoulders" : "--font-instrument-sans").trim() || "sans-serif";
            const src = await textToDataUrl(text.trim(), family, color);
            onReady({ kind: "text", src, text: text.trim(), font: font === "display" ? "display" : "sans", color });
          } catch {
            toast.error("Couldn't draw that text. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Place text
      </Button>
    </section>
  );
}

function PlacedGraphic({ graphic, label, selected }: { graphic: Graphic; label: string; selected: boolean }) {
  const scale = useHistoryGesture<number>((v) => useDesignStore.getState().updateGraphic(graphic.id, { scale: v }));
  const rot = useHistoryGesture<number>((v) => useDesignStore.getState().updateGraphic(graphic.id, { rotation: v }));
  return (
    <li className={`rounded-[var(--radius-control)] border p-3 ${selected ? "border-accent" : "border-line"}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => useStudioUI.getState().set({ selectedGraphic: graphic.id, selectedPart: graphic.partId })}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {graphic.src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={graphic.src} alt="" className="size-9 rounded bg-ink/80 object-contain p-1" />
          ) : null}
          <span className="min-w-0 truncate text-sm font-medium">
            {graphic.kind === "text" ? `“${graphic.text}”` : graphic.kind === "upload" ? "Uploaded image" : "Mark"} · {label}
          </span>
        </button>
        <button
          type="button"
          aria-label="Delete graphic"
          onClick={() => {
            useDesignStore.getState().removeGraphic(graphic.id);
            useStudioUI.getState().set({ selectedGraphic: null });
          }}
          className="grid size-8 place-items-center rounded-full text-ink-muted hover:text-danger"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {selected ? (
        <div className="mt-3 space-y-3">
          <Slider
            label="Size"
            value={graphic.scale}
            min={0.03}
            max={0.3}
            step={0.005}
            format={(v) => `${Math.round(v * 1000)}`}
            onStart={(v) => scale.onStart(v)}
            onChange={(v) => scale.onChange(v)}
            onEnd={(v) => scale.onEnd(v)}
          />
          <Slider
            label="Rotation"
            value={graphic.rotation}
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            format={(v) => `${Math.round((v * 180) / Math.PI)}°`}
            onStart={(v) => rot.onStart(v)}
            onChange={(v) => rot.onChange(v)}
            onEnd={(v) => rot.onEnd(v)}
          />
        </div>
      ) : null}
    </li>
  );
}
