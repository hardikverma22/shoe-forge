"use client";

import { useState } from "react";
import { ArrowRight, Dices, Sparkles } from "lucide-react";
import type { PartConfig, ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { generateColorway } from "@/lib/design/colorways";
import { stockFor } from "@/lib/design/presentation";
import { track } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/primitives";

const EXAMPLES = ["Tokyo at night", "Desert sunrise", "Forest trail", "Pastel cafe"];
type Parts = Record<string, Partial<PartConfig>>;

export function ColorwaysPanel({ product }: { product: ProductDef }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = (name: string, parts: Parts, source: string) => {
    useDesignStore.getState().applyParts(parts);
    toast.success(`${name} applied`);
    track("color_changed", { source });
  };

  const generate = async () => {
    const text = prompt.trim();
    if (text.length < 3) {
      setError("Describe the colorway in a few words, like “desert sunrise”.");
      return;
    }
    setError(null);
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
        toast.info("AI colorways are off on this site, so this one was generated locally.");
        return;
      }
      if (res.status === 429) {
        setError("That's a lot of requests. Try again in an hour.");
        return;
      }
      if (!res.ok) {
        setError("The colorway didn't come back. Try a different description.");
        return;
      }
      const data = (await res.json()) as { name: string; story: string; parts: Parts };
      apply(data.name, data.parts, "ai");
      toast.info(data.story);
    } catch {
      setError("Couldn't reach the colorway service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="ai-heading" className="space-y-3">
        <h3 id="ai-heading" className="flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} aria-hidden="true" className="text-accent" /> Describe a colorway
        </h3>
        <form
          className="border-line bg-surface-2 focus-within:border-accent flex items-center gap-1 rounded-full border p-1"
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
        >
          <label htmlFor="ai-prompt" className="sr-only">
            Describe a colorway
          </label>
          <input
            id="ai-prompt"
            value={prompt}
            maxLength={200}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tokyo at night, neon on black"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "ai-error" : undefined}
            className="placeholder:text-ink-muted h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <Button type="submit" variant="primary" disabled={busy} aria-busy={busy}>
            {busy ? "Designing…" : "Generate"}
          </Button>
        </form>
        {error ? (
          <p id="ai-error" role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setPrompt(e)}
              className="border-line hover:border-line-strong rounded-full border px-3 py-1 text-xs font-semibold"
            >
              {e}
            </button>
          ))}
        </div>
      </section>

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
                  onClick={() => apply(c.name, c.parts, "preset")}
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
