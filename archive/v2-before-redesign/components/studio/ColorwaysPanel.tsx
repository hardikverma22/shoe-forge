"use client";

import { useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { generateColorway } from "@/lib/design/colorways";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/primitives";

const EXAMPLES = ["Tokyo at night", "Desert sunrise", "Forest trail", "Pastel cafe"];

export function ColorwaysPanel({ product }: { product: ProductDef }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = (name: string, parts: Parameters<ReturnType<typeof useDesignStore.getState>["applyParts"]>[0], source: string) => {
    useDesignStore.getState().applyParts(parts);
    toast.success(`${name} applied`);
    track("color_changed", { source });
  };

  const generate = async () => {
    const text = prompt.trim();
    if (text.length < 3) {
      toast.error("Describe the colorway in a few words");
      return;
    }
    setBusy(true);
    track("ai_colorway_requested", { product: product.id });
    try {
      const res = await fetch("/api/colorway", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, prompt: text }),
      });
      if (res.status === 503) {
        apply("Generated colorway", generateColorway(product), "fallback");
        toast.info("AI is off on this site, so here's a generated colorway instead.");
        return;
      }
      if (res.status === 429) {
        toast.error("You've made a lot of requests. Try again in an hour.");
        return;
      }
      if (!res.ok) {
        toast.error("The colorway didn't come back. Try a different description.");
        return;
      }
      const data = (await res.json()) as { name: string; story: string; parts: Parameters<ReturnType<typeof useDesignStore.getState>["applyParts"]>[0] };
      apply(data.name, data.parts, "ai");
      toast.info(data.story);
    } catch {
      toast.error("Couldn't reach the colorway service. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="presets-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 id="presets-heading" className="font-semibold">
            Presets
          </h3>
          <Button size="sm" variant="ghost" onClick={() => apply("Surprise colorway", generateColorway(product), "surprise")}>
            <Dices size={16} aria-hidden="true" /> Surprise me
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-2">
          {product.colorways.map((c) => {
            const swatches = Object.values(c.parts).map((p) => p?.color).filter((x): x is string => Boolean(x)).slice(0, 4);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => apply(c.name, c.parts, "preset")}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-3 text-left transition-colors hover:border-accent"
                >
                  <span className="flex shrink-0 overflow-hidden rounded-full border border-line">
                    {swatches.map((hex, i) => (
                      <span key={i} className="size-5" style={{ background: hex }} />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{c.story}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="ai-heading" className="space-y-3 border-t border-line pt-5">
        <h3 id="ai-heading" className="flex items-center gap-2 font-semibold">
          <Sparkles size={16} aria-hidden="true" /> Describe a colorway
        </h3>
        <div className="flex gap-2">
          <label htmlFor="ai-prompt" className="sr-only">
            Describe a colorway
          </label>
          <input
            id="ai-prompt"
            value={prompt}
            maxLength={200}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void generate();
            }}
            placeholder="Tokyo at night, neon on black"
            className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm outline-none focus-visible:border-accent"
          />
          <Button variant="primary" disabled={busy} onClick={() => void generate()}>
            {busy ? "Designing…" : "Generate"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => setPrompt(e)} className="rounded-full border border-line px-3 py-1 text-xs hover:border-accent">
              {e}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
