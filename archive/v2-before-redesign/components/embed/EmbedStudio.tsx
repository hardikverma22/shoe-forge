"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { StudioShell } from "@/components/studio/StudioShell";
import { EmbedBridge } from "./EmbedBridge";

/** Allowed parent origin: the ?origin= query (set by the SDK) or, failing that, the referrer. */
function resolveOrigin(queryOrigin: string | undefined): string | null {
  const candidate = queryOrigin ?? (document.referrer ? new URL(document.referrer).origin : null);
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    return u.protocol === "https:" || u.hostname === "localhost" ? u.origin : null;
  } catch {
    return null;
  }
}

export function EmbedStudio({ productId, accent, theme, origin }: { productId: string; accent?: string; theme?: "light" | "dark"; origin?: string }) {
  const { setTheme } = useTheme();
  const [allowed, setAllowed] = useState<string | null>(null);

  useEffect(() => {
    if (theme) setTheme(theme);
    if (accent) document.documentElement.style.setProperty("--accent", accent);
    queueMicrotask(() => setAllowed(resolveOrigin(origin)));
  }, [theme, accent, origin, setTheme]);

  return (
    <>
      <StudioShell productId={productId} embedded />
      <EmbedBridge productId={productId} allowedOrigin={allowed} />
    </>
  );
}
