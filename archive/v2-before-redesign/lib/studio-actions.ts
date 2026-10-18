"use client";

import { encodeDesign } from "./design/codec";
import type { Design } from "./design/types";
import type { ProductDef } from "./products/schema";
import { useCapture, downloadBlob, safeFileName } from "./export/capture";
import { useSceneMeta } from "./three/scene-store";
import { saveDesign } from "./design/saved";
import { useBag } from "./bag/store";
import { priceOf } from "./design/pricing";
import { track } from "./analytics";
import { toast } from "./toast";

export function shareUrl(design: Design): { url: string; droppedUploads: number } {
  const { value, droppedUploads } = encodeDesign(design);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return { url: `${base}/studio/${design.productId}?d=${value}`, droppedUploads };
}

/** Copies the share link (or uses the native share sheet on phones). */
export async function copyShareLink(design: Design) {
  const { url, droppedUploads } = shareUrl(design);
  try {
    if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      await navigator.share({ title: design.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    toast.success(droppedUploads > 0 ? "Link copied. Uploaded images aren't included in links." : "Link copied");
    track("share", { method: "link" });
  } catch {
    toast.error("Couldn't copy the link. Copy it from the address bar.");
  }
}

export async function saveCurrent(design: Design) {
  let thumbnail: Blob | null = null;
  try {
    thumbnail = await useCapture.getState().capture?.({ scale: 1, transparent: false, background: undefined }) ?? null;
  } catch {
    thumbnail = null;
  }
  await saveDesign(design, thumbnail);
  toast.success("Saved to this browser");
  track("save", { product: design.productId });
}

export async function exportPng(design: Design, scale: number, transparent: boolean) {
  const capture = useCapture.getState().capture;
  if (!capture) return toast.error("The 3D view isn't ready yet");
  const blob = await capture({ scale, transparent });
  downloadBlob(blob, `${safeFileName(design.name)}@${scale}x.png`);
  track("export", { type: "png", scale });
}

export async function exportGlb(design: Design) {
  const root = useSceneMeta.getState().root;
  if (!root) return toast.error("The model isn't ready yet");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(root, { binary: true, onlyVisible: true });
  downloadBlob(new Blob([result as ArrayBuffer], { type: "model/gltf-binary" }), `${safeFileName(design.name)}.glb`);
  track("export", { type: "glb" });
}

export async function addToBag(product: ProductDef, design: Design, size: string) {
  let thumbnail: string | null = null;
  try {
    const blob = await useCapture.getState().capture?.({ scale: 0.5, transparent: true });
    if (blob) {
      thumbnail = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(blob);
      });
    }
  } catch {
    thumbnail = null;
  }
  const price = priceOf(product, design).total;
  useBag.getState().add({ productId: product.id, design, size, unitPrice: price, thumbnail });
  track("add_to_bag", { product: product.id, size, price });
  toast.success(`Added to bag · ${design.name}`);
}
