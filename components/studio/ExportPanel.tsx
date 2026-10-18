"use client";

import { useState } from "react";
import { Bookmark, Box, Download, Link2 } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { exportGlb, exportPng, copyShareLink, saveCurrent } from "@/lib/studio-actions";
import { Button, Segmented } from "@/components/ui/primitives";

export function ExportPanel({ product, design }: { product: ProductDef; design: Design }) {
  const [scale, setScale] = useState<"1" | "2" | "4">("2");
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="png-heading" className="space-y-3">
        <h3 id="png-heading" className="font-semibold">
          Picture
        </h3>
        <Segmented
          label="Resolution"
          value={scale}
          options={[
            { value: "1", label: "1×" },
            { value: "2", label: "2×" },
            { value: "4", label: "4×" },
          ]}
          onChange={setScale}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Transparent background
        </label>
        <Button variant="primary" className="w-full" disabled={busy !== null} onClick={() => run("png", () => exportPng(design, Number(scale), transparent))}>
          <Download size={16} aria-hidden="true" /> {busy === "png" ? "Rendering…" : "Download PNG"}
        </Button>
      </section>

      <section aria-labelledby="files-heading" className="space-y-3 border-t border-line pt-5">
        <h3 id="files-heading" className="font-semibold">
          Files and sharing
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Button onClick={() => run("glb", () => exportGlb(design))} disabled={busy !== null}>
            <Box size={16} aria-hidden="true" /> Download 3D model (.glb)
          </Button>
          <Button onClick={() => copyShareLink(design)}>
            <Link2 size={16} aria-hidden="true" /> Copy share link
          </Button>
          <Button onClick={() => run("save", () => saveCurrent(design))} disabled={busy !== null}>
            <Bookmark size={16} aria-hidden="true" /> Save to my designs
          </Button>
        </div>
        <p className="text-xs text-ink-muted">
          {product.name} · {design.parts.upper ? "Your design is in the link. Uploaded images are only kept in your saved designs." : ""}
        </p>
      </section>
    </div>
  );
}
