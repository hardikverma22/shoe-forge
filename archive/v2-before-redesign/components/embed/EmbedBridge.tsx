"use client";

import { useEffect } from "react";
import { useDesignStore } from "@/lib/design/store";
import { HostMessage, type FrameMessage } from "@/lib/embed/protocol";
import { getProduct } from "@/lib/products";
import { priceOf } from "@/lib/design/pricing";
import { track } from "@/lib/analytics";

/**
 * Talks to the host page with postMessage. Only messages from the allowed origin are handled,
 * and replies go only to that origin, never "*".
 */
export function EmbedBridge({ productId, allowedOrigin }: { productId: string; allowedOrigin: string | null }) {
  useEffect(() => {
    if (!allowedOrigin || window.parent === window) return;
    const product = getProduct(productId);
    if (!product) return;

    const post = (msg: FrameMessage) => window.parent.postMessage(msg, allowedOrigin);

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== allowedOrigin || e.source !== window.parent) return;
      const parsed = HostMessage.safeParse(e.data);
      if (!parsed.success) return;
      const msg = parsed.data;
      const store = useDesignStore.getState();
      if (!store.design) return;
      if (msg.type === "sf:setPart") {
        if (!product.parts.some((p) => p.id === msg.partId)) {
          post({ type: "sf:error", message: `Unknown part: ${msg.partId}` });
          return;
        }
        if (msg.material) {
          const err = store.setPartMaterial(product, msg.partId, msg.material);
          if (err) post({ type: "sf:error", message: err });
        }
        if (msg.color) store.setPartColor(msg.partId, msg.color);
      } else if (msg.type === "sf:getDesign") {
        post({ type: "sf:design", requestId: msg.requestId, design: { name: store.design.name, parts: store.design.parts } });
      }
    };

    let last = "";
    const unsub = useDesignStore.subscribe((s) => {
      if (!s.design) return;
      const key = JSON.stringify(s.design.parts);
      if (key === last) return;
      last = key;
      post({
        type: "sf:change",
        design: { name: s.design.name, parts: s.design.parts },
        price: priceOf(product, s.design).total,
      });
      track("embed_change", { product: product.id });
    });

    window.addEventListener("message", onMessage);
    post({ type: "sf:ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      unsub();
    };
  }, [productId, allowedOrigin]);

  return null;
}
