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

/** Original marks only (no real brand logos); people can upload a logo they own. */
const MARKS = [
  "star",
  "bolt",
  "flame",
  "heart",
  "moon",
  "crown",
  "shield",
  "leaf",
  "sparkles",
  "cloud",
  "droplet",
  "hexagon",
  "snowflake",
  "target",
  "infinity",
  "asterisk",
  "mountain",
  "wind",
  "music",
  "globe",
  "anvil",
  "spark",
  "wave",
  "monogram",
] as const;
export const MARK_COLORS = [
  "#0A0A12",
  "#F4F4F2",
  "#FF4A1C",
  "#D7FF3A",
  "#1E2BFF",
  "#C08A55",
  "#D6332F",
  "#3A7D44",
  "#F2C14E",
  "#E86FA1",
];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export function GraphicsPanel({ product, design }: { product: ProductDef; design: Design }) {
  const placing = useStudioUI((s) => s.placing);
  const selectedGraphic = useStudioUI((s) => s.selectedGraphic);
  const max = maxGraphics(product);
  const used = design.graphics.length;
  const full = used >= max;
  const [markColor, setMarkColor] = useState(MARK_COLORS[0]!);

  const startPlacing = (p: NonNullable<typeof placing>) => {
    if (full) {
      toast.error(`You can add up to ${max} graphics`);
      return;
    }
    // The banner over the canvas explains where to click; no toast on top of it.
    useStudioUI.getState().set({ placing: p });
  };

  return (
    <div className="space-y-7">
      <p className="text-ink-muted text-sm">
        {used} of {max} graphics used.{" "}
        {placing ? (
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => useStudioUI.getState().set({ placing: null })}
          >
            Cancel placing
          </button>
        ) : null}
      </p>

      <section aria-labelledby="marks-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 id="marks-heading" className="text-sm font-bold">
            Marks
          </h3>
          <span className="text-ink-muted text-xs">Pick a color, then a mark</span>
        </div>
        <div role="radiogroup" aria-label="Mark color" className="flex flex-wrap gap-2">
          {MARK_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={markColor === hex}
              aria-label={`Mark color ${hex}`}
              onClick={() => setMarkColor(hex)}
              className={`border-ink/15 size-7 cursor-pointer rounded-full border transition-transform hover:scale-110 ${
                markColor === hex ? "ring-accent ring-offset-surface ring-2 ring-offset-2" : ""
              }`}
              style={{ background: hex }}
            />
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {MARKS.map((m) => (
            <button
              key={m}
              type="button"
              aria-label={`Place the ${m} mark`}
              title={m}
              disabled={full}
              onClick={() =>
                startPlacing({ kind: "mark", src: `/marks/${m}.png`, color: markColor })
              }
              className="border-line bg-surface-2 hover:border-line-strong grid aspect-square cursor-pointer place-items-center rounded-xl border p-2.5 transition-[transform,border-color] hover:scale-105 disabled:opacity-40"
            >
              <span
                aria-hidden="true"
                className="size-full"
                style={{
                  background: markColor,
                  WebkitMask: `url(/marks/${m}.png) center / contain no-repeat`,
                  mask: `url(/marks/${m}.png) center / contain no-repeat`,
                }}
              />
            </button>
          ))}
        </div>
        <p className="text-ink-muted text-xs">
          Want your own logo? Upload it below. Only use logos you have the right to use.
        </p>
      </section>

      <UploadSection onReady={(src) => startPlacing({ kind: "upload", src })} disabled={full} />
      <TextSection onReady={(p) => startPlacing(p)} disabled={full} palette={product.palette} />

      {design.graphics.length > 0 ? (
        <section aria-labelledby="placed-heading" className="border-line space-y-3 border-t pt-5">
          <h3 id="placed-heading" className="text-sm font-bold">
            On the shoe
          </h3>
          <ul className="space-y-2">
            {design.graphics.map((g) => (
              <PlacedGraphic
                key={g.id}
                graphic={g}
                label={product.parts.find((p) => p.id === g.partId)?.label ?? g.partId}
                selected={selectedGraphic === g.id}
              />
            ))}
          </ul>
          <p className="text-ink-muted text-xs">
            Drag a selected graphic along the shoe. Press Delete to remove it.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function UploadSection({
  onReady,
  disabled,
}: {
  onReady: (src: string) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="upload-heading" className="space-y-2">
      <h3 id="upload-heading" className="text-sm font-bold">
        Upload
      </h3>
      <label className="border-line hover:bg-ink/3 hover:border-accent flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed p-4 text-sm">
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
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function TextSection({
  onReady,
  disabled,
  palette,
}: {
  onReady: (p: { kind: "text"; src: string; text: string; font: string; color: string }) => void;
  disabled: boolean;
  palette: string[];
}) {
  const [text, setText] = useState("");
  const [font, setFont] = useState<"display" | "sans">("display");
  const [color, setColor] = useState(palette[1] ?? "#1B1B1F");
  const [busy, setBusy] = useState(false);

  return (
    <section aria-labelledby="text-heading" className="space-y-3">
      <h3 id="text-heading" className="text-sm font-bold">
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
          className="border-line bg-surface-2 focus-visible:border-accent h-10 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none"
        />
        <select
          aria-label="Font"
          value={font}
          onChange={(e) => setFont(e.target.value as "display" | "sans")}
          className="border-line bg-surface-2 h-10 rounded-full border px-3 text-sm"
        >
          <option value="display">Condensed</option>
          <option value="sans">Regular</option>
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
            className={`size-7 rounded-full border ${color === hex ? "ring-accent ring-offset-surface ring-2 ring-offset-2" : "border-line"}`}
            style={{ background: hex }}
          />
        ))}
      </div>
      <Button
        disabled={!text.trim() || disabled || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const { textToDataUrl: draw, fontFor } = await import("@/lib/graphics/text");
            const f = fontFor(font);
            const src = await draw(text.trim(), f.family, color, f.condensed);
            onReady({
              kind: "text",
              src,
              text: text.trim(),
              font: font === "display" ? "display" : "sans",
              color,
            });
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

function PlacedGraphic({
  graphic,
  label,
  selected,
}: {
  graphic: Graphic;
  label: string;
  selected: boolean;
}) {
  const scale = useHistoryGesture<number>((v) =>
    useDesignStore.getState().updateGraphic(graphic.id, { scale: v }),
  );
  const rot = useHistoryGesture<number>((v) =>
    useDesignStore.getState().updateGraphic(graphic.id, { rotation: v }),
  );
  return (
    <li className={`rounded-xl border p-3 ${selected ? "border-accent" : "border-line"}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            useStudioUI
              .getState()
              .set({ selectedGraphic: graphic.id, selectedPart: graphic.partId })
          }
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {graphic.src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={graphic.src} alt="" className="bg-ink/80 size-9 rounded object-contain p-1" />
          ) : null}
          <span className="min-w-0 truncate text-sm font-medium">
            {graphic.kind === "text"
              ? `“${graphic.text}”`
              : graphic.kind === "upload"
                ? "Uploaded image"
                : "Mark"}{" "}
            · {label}
          </span>
        </button>
        <button
          type="button"
          aria-label="Delete graphic"
          onClick={() => {
            useDesignStore.getState().removeGraphic(graphic.id);
            useStudioUI.getState().set({ selectedGraphic: null });
          }}
          className="text-ink-muted hover:text-danger grid size-8 place-items-center rounded-full"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      {selected ? (
        <div className="mt-3 space-y-3">
          {graphic.kind === "mark" ? (
            <div role="radiogroup" aria-label="Mark color" className="flex flex-wrap gap-1.5">
              {MARK_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={(graphic.color ?? "#0A0A12").toUpperCase() === hex}
                  aria-label={`Mark color ${hex}`}
                  onClick={() =>
                    useDesignStore.getState().updateGraphic(graphic.id, { color: hex })
                  }
                  className={`border-ink/15 size-6 cursor-pointer rounded-full border ${
                    (graphic.color ?? "#0A0A12").toUpperCase() === hex
                      ? "ring-accent ring-offset-surface ring-2 ring-offset-1"
                      : ""
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          ) : null}
          <Slider
            label="Size"
            value={graphic.scale}
            min={0.05}
            max={0.5}
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
