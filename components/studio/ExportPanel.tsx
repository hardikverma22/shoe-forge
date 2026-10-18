"use client";

import { useState } from "react";
import { Bookmark, Box, Download, Link2 } from "lucide-react";
import Link from "next/link";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { exportGlb, exportPng, copyShareLink, saveCurrent } from "@/lib/studio-actions";
import { Button, Segmented } from "@/components/ui/primitives";

export function ExportPanel({ product, design }: { product: ProductDef; design: Design }) {
  const [scale, setScale] = useState<"1" | "2" | "4">("2");
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const hasUploads = design.graphics.some((g) => g.kind === "upload");

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="png-heading" className="space-y-4">
        <h3 id="png-heading" className="text-sm font-bold">
          Picture
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Transparent
          </label>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={busy !== null}
          onClick={() => run("png", () => exportPng(design, Number(scale), transparent))}
        >
          <Download size={17} aria-hidden="true" /> {busy === "png" ? "Rendering…" : "Download PNG"}
        </Button>
      </section>

      <section aria-labelledby="files-heading" className="space-y-3">
        <h3 id="files-heading" className="text-sm font-bold">
          Keep and share
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => run("save", () => saveCurrent(design))}
            disabled={busy !== null}
            className="justify-start"
          >
            <Bookmark size={16} aria-hidden="true" /> Save to my designs
          </Button>
          <Button onClick={() => copyShareLink(design)} className="justify-start">
            <Link2 size={16} aria-hidden="true" /> Copy share link
          </Button>
          <Button
            onClick={() => run("glb", () => exportGlb(design))}
            disabled={busy !== null}
            className="justify-start"
          >
            <Box size={16} aria-hidden="true" />{" "}
            {busy === "glb" ? "Packing the model…" : "Download 3D model (.glb)"}
          </Button>
        </div>
        <p className="text-ink-muted text-xs leading-relaxed">
          The link rebuilds this exact {product.name}.
          {hasUploads
            ? " Uploaded images don't fit in a link, so they're only kept in saved designs."
            : ""}{" "}
          Saved designs live in this browser:{" "}
          <Link href="/gallery" className="text-accent font-semibold underline">
            open my designs
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
