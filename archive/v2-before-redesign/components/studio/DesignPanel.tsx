"use client";

import { useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { RotateCcw, ShoppingBag } from "lucide-react";
import type { MaterialId, ProductDef } from "@/lib/products/schema";
import type { Design, StageId } from "@/lib/design/types";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { materialBlockedReason } from "@/lib/design/rules";
import { useHistoryGesture } from "@/lib/design/gesture";
import { MATERIALS } from "@/lib/materials/presets";
import { priceOf, formatPrice } from "@/lib/design/pricing";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { addToBag } from "@/lib/studio-actions";
import { Button, Segmented, Slider } from "@/components/ui/primitives";

const STAGES: { value: StageId; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "daylight", label: "Daylight" },
  { value: "sunset", label: "Sunset" },
  { value: "night", label: "Night" },
];

const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"];

export function DesignPanel({ product, design }: { product: ProductDef; design: Design }) {
  const selected = useStudioUI((s) => s.selectedPart);
  const setStage = useDesignStore((s) => s.setStage);
  const price = priceOf(product, design);
  const [size, setSize] = useState<string>(() => (typeof localStorage !== "undefined" ? localStorage.getItem("sf:size") ?? "" : ""));
  const [sizeError, setSizeError] = useState(false);

  const part = product.parts.find((p) => p.id === selected) ?? null;
  const cfg = part ? design.parts[part.id] : undefined;

  return (
    <div className="space-y-6">
      <section aria-labelledby="parts-heading" className="space-y-2">
        <h3 id="parts-heading" className="font-display text-2xl font-extrabold">
          Parts
        </h3>
        <ul className="grid grid-cols-2 gap-1.5">
          {product.parts.map((p) => {
            const c = design.parts[p.id];
            const isSel = p.id === selected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => {
                    useStudioUI.getState().set({ selectedPart: p.id });
                    track("part_selected", { part: p.id });
                  }}
                  className={`flex w-full items-center gap-2 rounded-[var(--radius-control)] border px-2.5 py-2 text-left text-sm transition-colors ${
                    isSel ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent"
                  }`}
                >
                  <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-line" style={{ background: c?.color }} />
                  <span className="min-w-0 truncate font-medium">{p.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-ink-muted">Click a part on the shoe, or press [ and ] to move between parts.</p>
      </section>

      {part && cfg ? (
        <>
          <section aria-labelledby="material-heading" className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 id="material-heading" className="font-semibold">
                {part.label} material
              </h3>
              <span className="text-xs text-ink-muted">{part.description}</span>
            </div>
            <div role="radiogroup" aria-label="Material" className="grid grid-cols-2 gap-1.5">
              {Object.values(MATERIALS).map((m) => {
                const reason = materialBlockedReason(product, part.id, m.id as MaterialId);
                const checked = cfg.material === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-disabled={Boolean(reason)}
                    title={reason ?? m.description}
                    onClick={() => {
                      const err = useDesignStore.getState().setPartMaterial(product, part.id, m.id as MaterialId);
                      if (err) toast.error(err);
                      else track("material_changed", { part: part.id, material: m.id });
                    }}
                    className={`flex items-center justify-between rounded-[var(--radius-control)] border px-2.5 py-2 text-left text-sm transition-colors ${
                      checked ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent"
                    } ${reason ? "opacity-45" : ""}`}
                  >
                    <span className="font-medium">{m.label}</span>
                    {m.priceDelta > 0 ? <span className="tabular text-xs text-ink-muted">+{m.priceDelta}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="color-heading" className="space-y-3">
            <h3 id="color-heading" className="font-semibold">
              Color
            </h3>
            <div role="radiogroup" aria-label="Palette" className="flex flex-wrap gap-2">
              {product.palette.map((hex) => {
                const checked = cfg.color.toUpperCase() === hex.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={`Color ${hex}`}
                    onClick={() => {
                      useDesignStore.getState().setPartColor(part.id, hex);
                      track("color_changed", { part: part.id });
                    }}
                    className={`size-8 rounded-full border transition-transform hover:scale-110 ${
                      checked ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "border-line"
                    }`}
                    style={{ background: hex }}
                  />
                );
              })}
            </div>
            <CustomColor partId={part.id} color={cfg.color} />
          </section>

          <section aria-labelledby="finish-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="finish-heading" className="font-semibold">
                Finish
              </h3>
              <button
                type="button"
                onClick={() => {
                  useDesignStore.getState().resetPart(product, part.id);
                  toast.info(`${part.label} reset`);
                }}
                className="inline-flex items-center gap-1 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                <RotateCcw size={14} aria-hidden="true" /> Reset part
              </button>
            </div>
            <FinishSliders key={part.id} partId={part.id} roughness={cfg.roughness ?? MATERIALS[cfg.material].roughness} sheen={cfg.sheen ?? MATERIALS[cfg.material].sheen} sheenAvailable={MATERIALS[cfg.material].sheen > 0} />
          </section>
        </>
      ) : null}

      <section aria-labelledby="stage-heading" className="space-y-2">
        <h3 id="stage-heading" className="font-semibold">
          Stage lighting
        </h3>
        <Segmented label="Stage lighting" value={design.stage} options={STAGES} onChange={(v) => setStage(v)} />
      </section>

      <section aria-labelledby="buy-heading" className="space-y-3 border-t border-line pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 id="buy-heading" className="sr-only">
              Price and size
            </h3>
            <p className="text-xs text-ink-muted">Total price</p>
            <p className="tabular font-display text-4xl font-extrabold leading-none text-gum">{formatPrice(price.total, product.currency)}</p>
          </div>
          <details className="text-right text-xs text-ink-muted">
            <summary className="cursor-pointer underline underline-offset-4">Breakdown</summary>
            <p className="tabular mt-1">Base {formatPrice(price.base, product.currency)}</p>
            <p className="tabular">Materials +{formatPrice(price.materials, product.currency)}</p>
            <p className="tabular">Graphics +{formatPrice(price.graphics, product.currency)}</p>
          </details>
        </div>
        <div role="radiogroup" aria-label="Size" aria-invalid={sizeError} className={`grid grid-cols-6 gap-1.5`}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => {
                setSize(s);
                setSizeError(false);
                localStorage.setItem("sf:size", s);
              }}
              className={`tabular h-9 rounded-[var(--radius-control)] border text-sm font-semibold transition-colors ${
                size === s ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {sizeError ? <p className="text-sm text-danger">Choose a size first.</p> : null}
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            if (!size) {
              setSizeError(true);
              return;
            }
            void addToBag(product, design, size);
          }}
        >
          <ShoppingBag size={16} aria-hidden="true" /> Add to bag
        </Button>
      </section>
    </div>
  );
}

function CustomColor({ partId, color }: { partId: string; color: string }) {
  const [open, setOpen] = useState(false);
  const latest = useRef(color);
  const gesture = useHistoryGesture<string>((v) => useDesignStore.getState().setPartColor(partId, v));
  return (
    <div className="space-y-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="text-sm font-medium underline underline-offset-4">
        {open ? "Hide custom color" : "Custom color"}
      </button>
      {open ? (
        <div
          className="space-y-3 rounded-[var(--radius-control)] border border-line bg-surface p-3"
          onPointerDown={() => gesture.onStart(color)}
          onPointerUp={() => gesture.onEnd(latest.current)}
        >
          <HexColorPicker
            color={color}
            onChange={(v) => {
              latest.current = v;
              gesture.onChange(v);
            }}
            style={{ width: "100%" }}
          />
          <div className="flex items-center gap-2">
            <label htmlFor={`hex-${partId}`} className="text-sm">
              HEX
            </label>
            <HexColorInput
              id={`hex-${partId}`}
              color={color}
              prefixed
              onChange={(v) => {
                latest.current = v;
                useDesignStore.getState().setPartColor(partId, v);
              }}
              className="tabular h-9 w-28 rounded-[var(--radius-control)] border border-line bg-paper px-2 text-sm"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FinishSliders({ partId, roughness, sheen, sheenAvailable }: { partId: string; roughness: number; sheen: number; sheenAvailable: boolean }) {
  const rough = useHistoryGesture<number>((v) => useDesignStore.getState().setPartFinish(partId, { roughness: v }));
  const sheenG = useHistoryGesture<number>((v) => useDesignStore.getState().setPartFinish(partId, { sheen: v }));
  return (
    <>
      <Slider
        label="Roughness"
        value={roughness}
        min={0}
        max={1}
        onStart={(v) => rough.onStart(v)}
        onChange={(v) => rough.onChange(v)}
        onEnd={(v) => rough.onEnd(v)}
      />
      <Slider
        label="Sheen"
        value={sheen}
        min={0}
        max={1}
        disabled={!sheenAvailable}
        onStart={(v) => sheenG.onStart(v)}
        onChange={(v) => sheenG.onChange(v)}
        onEnd={(v) => sheenG.onEnd(v)}
      />
    </>
  );
}
