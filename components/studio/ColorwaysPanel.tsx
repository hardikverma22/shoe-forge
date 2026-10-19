"use client";

import { ArrowRight, Dices } from "lucide-react";
import type { PartConfig, ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { generateColorway } from "@/lib/design/colorways";
import { designFromColorway, stockFor } from "@/lib/design/presentation";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/primitives";

type Parts = Record<string, Partial<PartConfig>>;

/** Every part of a preset, finish overrides cleared (the store merges patches into the parts). */
function presetParts(product: ProductDef, colorway: ProductDef["colorways"][number]): Parts {
  return Object.fromEntries(
    Object.entries(designFromColorway(product, colorway).parts).map(([id, cfg]) => [
      id,
      { roughness: undefined, sheen: undefined, ...cfg },
    ]),
  );
}

export function ColorwaysPanel({ product }: { product: ProductDef }) {

  const apply = (name: string, parts: Parts, source: string) => {
    useDesignStore.getState().applyParts(parts);
    toast.success(`${name} applied`);
    track("color_changed", { source });
  };

  return (
    <div className="space-y-8">

      <section aria-labelledby="presets-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 id="presets-heading" className="text-sm font-bold">
            Colorways
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => apply("Surprise colorway", generateColorway(product), "surprise")}
            aria-keyshortcuts="R"
          >
            <Dices size={15} aria-hidden="true" /> Surprise me
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-2">
          {product.colorways.map((c) => {
            const stock = stockFor(c);
            const swatches = Object.values(c.parts)
              .map((p) => p?.color)
              .filter((x): x is string => Boolean(x));
            return (
              <li key={c.id}>
                <button
                  type="button"
                  // A preset is the whole shoe: start from the defaults, so nothing from the
                  // previous colorway (a gum sole, a finish override) carries over.
                  onClick={() => apply(c.name, presetParts(product, c), "preset")}
                  className="group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl p-3 pr-4 text-left transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
                  style={{ background: stock.field, color: stock.ink }}
                >
                  <span className="flex shrink-0 -space-x-1.5" aria-hidden="true">
                    {swatches.slice(0, 4).map((hex, i) => (
                      <span
                        key={i}
                        className="size-7 rounded-full border-[1.5px]"
                        style={{ background: hex, borderColor: stock.ink }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-[1.5rem]">{c.name}</span>
                    <span className="block truncate text-xs">{c.story}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
