"use client";

import { useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { ArrowRight, Check, ChevronDown, Lock, RotateCcw } from "lucide-react";
import type { MaterialId, ProductDef } from "@/lib/products/schema";
import type { Design, StageId } from "@/lib/design/types";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { materialBlockedReason } from "@/lib/design/rules";
import { useHistoryGesture } from "@/lib/design/gesture";
import { MATERIALS, MATERIAL_LIST } from "@/lib/materials/presets";
import { inkOn } from "@/lib/design/presentation";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { Button, Segmented, Slider } from "@/components/ui/primitives";
import { partNo, pickPart } from "./PartRail";

const STAGES: { value: StageId; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "daylight", label: "Day" },
  { value: "sunset", label: "Sunset" },
  { value: "night", label: "Night" },
];

const RECENT_KEY = "sf:recent-colors";

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function pushRecent(hex: string) {
  try {
    const next = [hex.toUpperCase(), ...readRecent().filter((x) => x !== hex.toUpperCase())].slice(
      0,
      8,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage can be unavailable; recent colors are a convenience
  }
}

export function DesignPanel({ product, design }: { product: ProductDef; design: Design }) {
  const selected = useStudioUI((s) => s.selectedPart);
  const setStage = useDesignStore((s) => s.setStage);
  const index = product.parts.findIndex((p) => p.id === selected);
  const part = product.parts[index] ?? null;
  const cfg = part ? design.parts[part.id] : undefined;

  if (!part || !cfg) {
    return (
      <div className="space-y-4">
        <p className="display text-[2rem]">Pick a part</p>
        <p className="text-ink-muted text-sm">Click the shoe, or choose a part from the list.</p>
        <ul className="grid grid-cols-2 gap-1.5">
          {product.parts.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pickPart(p.id)}
                className="border-line hover:border-line-strong flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold"
              >
                <span className="spec text-ink-muted">{partNo(i)}</span>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const step = (dir: 1 | -1) => {
    const next = product.parts[(index + dir + product.parts.length) % product.parts.length];
    if (next) pickPart(next.id);
  };

  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="display flex items-center gap-3 text-[2.5rem]">
            <span
              aria-hidden="true"
              className="spec border-line-strong grid size-8 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-bold"
            >
              {partNo(index)}
            </span>
            <span className="sr-only">Part {partNo(index)}: </span>
            {part.label}
          </h3>
          <p className="text-ink-muted mt-1 text-sm">{part.description}</p>
        </div>
        <div className="flex shrink-0 gap-1 pt-1">
          <button
            type="button"
            aria-label="Previous part"
            onClick={() => step(-1)}
            className="border-line hover:border-line-strong grid size-9 place-items-center rounded-full border"
          >
            <ChevronDown size={16} className="rotate-90" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next part"
            onClick={() => step(1)}
            className="border-line hover:border-line-strong grid size-9 place-items-center rounded-full border"
          >
            <ChevronDown size={16} className="-rotate-90" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section aria-labelledby="material-heading" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h4 id="material-heading" className="text-sm font-bold">
            Material
          </h4>
          <span className="text-ink-muted text-xs">
            {part.allowedMaterials.length} of {MATERIAL_LIST.length} fit this part
          </span>
        </div>
        <div role="radiogroup" aria-label="Material" className="grid grid-cols-3 gap-2">
          {MATERIAL_LIST.map((m) => {
            const reason = materialBlockedReason(product, part.id, m.id as MaterialId);
            const checked = cfg.material === m.id;
            const ink = inkOn(cfg.color);
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-disabled={Boolean(reason)}
                aria-label={reason ? `${m.label}, not available: ${reason}` : m.label}
                title={reason ?? m.description}
                onClick={() => {
                  if (reason) {
                    toast.info(reason);
                    return;
                  }
                  const err = useDesignStore
                    .getState()
                    .setPartMaterial(product, part.id, m.id as MaterialId);
                  if (err) toast.error(err);
                  else track("material_changed", { part: part.id, material: m.id });
                }}
                className={`group relative flex aspect-[1.05] flex-col justify-end overflow-hidden rounded-xl text-left transition-[box-shadow,transform,opacity] duration-200 ${
                  reason
                    ? "cursor-not-allowed opacity-35 saturate-0"
                    : "cursor-pointer hover:-translate-y-0.5"
                } ${checked ? "ring-accent ring-offset-surface ring-2 ring-offset-2" : "ring-line ring-1"}`}
              >
                <span
                  aria-hidden="true"
                  data-material={m.id}
                  className="swatch-surface absolute inset-0"
                  style={
                    {
                      "--swatch": cfg.color,
                      "--relief": `url(/textures/${m.id}/swatch.webp)`,
                      "--relief-size": m.id === "knit" ? "90px" : "150px",
                    } as React.CSSProperties
                  }
                />
                <span
                  className="relative flex items-center justify-between gap-1 px-2 pb-1.5"
                  style={{ color: ink }}
                >
                  <span className="text-xs font-bold">{m.label}</span>
                  {checked ? (
                    <Check size={14} aria-hidden="true" />
                  ) : reason ? (
                    <Lock size={12} aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <ColorSection key={part.id} product={product} partId={part.id} color={cfg.color} />

      <section aria-labelledby="finish-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 id="finish-heading" className="text-sm font-bold">
            Finish
          </h4>
          <button
            type="button"
            onClick={() => {
              useDesignStore.getState().resetPart(product, part.id);
              toast.info(`${part.label} reset`);
            }}
            className="text-ink-muted hover:bg-ink/6 hover:text-ink inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            <RotateCcw size={13} aria-hidden="true" /> Reset part
          </button>
        </div>
        <FinishSliders
          key={`${part.id}-${cfg.material}`}
          partId={part.id}
          roughness={cfg.roughness ?? MATERIALS[cfg.material].roughness}
          sheen={cfg.sheen ?? MATERIALS[cfg.material].sheen}
          sheenAvailable={MATERIALS[cfg.material].sheen > 0}
        />
      </section>

      <section aria-labelledby="stage-heading" className="space-y-2 lg:hidden">
        <h4 id="stage-heading" className="text-sm font-bold">
          Lighting
        </h4>
        <Segmented
          label="Stage lighting"
          value={design.stage}
          options={STAGES}
          onChange={(v) => setStage(v)}
        />
      </section>

      {/* Step through the shoe one part at a time, like a guided build. */}
      <div className="border-line bg-surface sticky -bottom-8 -mx-4 flex items-center gap-2 border-t px-4 py-3 lg:-mx-5 lg:px-5">
        <span className="spec text-ink-muted">
          {partNo(index)} / {String(product.parts.length).padStart(2, "0")}
        </span>
        <span className="flex-1" />
        <Button size="md" variant="primary" onClick={() => step(1)}>
          Next: {product.parts[(index + 1) % product.parts.length]?.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function ColorSection({
  product,
  partId,
  color,
}: {
  product: ProductDef;
  partId: string;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecent(),
  );
  const latest = useRef(color);
  const gesture = useHistoryGesture<string>((v) =>
    useDesignStore.getState().setPartColor(partId, v),
  );

  const apply = (hex: string) => {
    useDesignStore.getState().setPartColor(partId, hex);
    pushRecent(hex);
    setRecent(readRecent());
    track("color_changed", { part: partId });
  };

  // Named colors (brand shoes), like a real builder: the picked color's name is shown.
  const named = product.colors;
  const colorName = named?.find((c) => c.hex.toUpperCase() === color.toUpperCase())?.name;

  const swatch = (hex: string, label: string) => {
    const checked = color.toUpperCase() === hex.toUpperCase();
    return (
      <button
        key={hex + label}
        type="button"
        role="radio"
        aria-checked={checked}
        aria-label={`${label} ${hex}`}
        onClick={() => apply(hex)}
        className={`border-ink/12 relative aspect-square cursor-pointer rounded-full border shadow-[inset_0_-3px_6px_rgb(0_0_0/0.14)] transition-transform duration-200 ease-[var(--ease-out-expo)] hover:scale-110 ${
          checked ? "ring-accent ring-offset-surface ring-2 ring-offset-2" : ""
        }`}
        style={{ background: hex }}
      />
    );
  };

  return (
    <section aria-labelledby="color-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 id="color-heading" className="text-sm font-bold">
          Color
        </h4>
        <span className="spec text-ink-muted">
          {colorName ? `${colorName} · ` : ""}
          {color.toUpperCase()}
        </span>
      </div>
      <div role="radiogroup" aria-label="Palette" className="grid grid-cols-6 gap-2.5">
        {named
          ? named.map((c) => swatch(c.hex, c.name))
          : product.palette.map((hex) => swatch(hex, "Color"))}
      </div>
      {recent.length > 0 ? (
        <div className="space-y-2">
          <p className="text-ink-muted text-xs">Recent</p>
          <div role="radiogroup" aria-label="Recent colors" className="grid grid-cols-8 gap-2">
            {recent.map((hex) => swatch(hex, "Recent color"))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-accent inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        Custom color{" "}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          className="border-line bg-surface-2 space-y-3 rounded-2xl border p-3"
          onPointerDown={() => gesture.onStart(color)}
          onPointerUp={() => {
            gesture.onEnd(latest.current);
            pushRecent(latest.current);
            setRecent(readRecent());
          }}
        >
          <HexColorPicker
            color={color}
            onChange={(v) => {
              latest.current = v;
              gesture.onChange(v);
            }}
            style={{ width: "100%", height: 160 }}
          />
          <div className="flex items-center gap-2">
            <label htmlFor={`hex-${partId}`} className="spec text-ink-muted">
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
              onBlur={() => pushRecent(latest.current)}
              className="spec border-line bg-surface focus-visible:border-accent h-9 w-28 rounded-full border px-3 text-[0.75rem] uppercase outline-none"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FinishSliders({
  partId,
  roughness,
  sheen,
  sheenAvailable,
}: {
  partId: string;
  roughness: number;
  sheen: number;
  sheenAvailable: boolean;
}) {
  const rough = useHistoryGesture<number>((v) =>
    useDesignStore.getState().setPartFinish(partId, { roughness: v }),
  );
  const sheenG = useHistoryGesture<number>((v) =>
    useDesignStore.getState().setPartFinish(partId, { sheen: v }),
  );
  return (
    <>
      <Slider
        label="Roughness"
        value={roughness}
        min={0}
        max={1}
        format={(v) =>
          v < 0.35
            ? `Glossy ${v.toFixed(2)}`
            : v < 0.7
              ? `Satin ${v.toFixed(2)}`
              : `Matte ${v.toFixed(2)}`
        }
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
        hint={sheenAvailable ? undefined : "Sheen applies to fabrics like suede, knit and mesh."}
        onStart={(v) => sheenG.onStart(v)}
        onChange={(v) => sheenG.onChange(v)}
        onEnd={(v) => sheenG.onEnd(v)}
      />
    </>
  );
}
