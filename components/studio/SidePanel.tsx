"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { priceOf, formatPrice } from "@/lib/design/pricing";
import { DesignPanel } from "./DesignPanel";
import { GraphicsPanel } from "./GraphicsPanel";
import { ColorwaysPanel } from "./ColorwaysPanel";
import { ExportPanel } from "./ExportPanel";

type Tab = "design" | "graphics" | "colorways" | "export";
const TABS: { id: Tab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "graphics", label: "Graphics" },
  { id: "colorways", label: "Colorways" },
  { id: "export", label: "Export" },
];

/** Right panel on desktop, bottom sheet on phones. */
export function SidePanel({
  product,
  design,
  open,
  onToggle,
  embedded,
}: {
  product: ProductDef;
  design: Design;
  open: boolean;
  onToggle: () => void;
  onPrimaryAction: () => void;
  embedded: boolean;
}) {
  const [tab, setTab] = useState<Tab>("design");
  const price = formatPrice(priceOf(product, design).total, product.currency);

  return (
    <aside
      aria-label="Design controls"
      className={`glass fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[var(--radius-panel)] transition-[max-height] duration-500 lg:bottom-3 lg:right-3 lg:top-[4.5rem] lg:left-auto lg:w-[360px] lg:rounded-[var(--radius-panel)] ${
        open ? "max-h-[62dvh]" : "max-h-[4.25rem]"
      } ${embedded ? "lg:top-3" : ""} lg:max-h-none`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 lg:hidden">
        <p className="tabular font-display text-2xl font-extrabold text-gum">{price}</p>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-full border border-line bg-surface"
        >
          <span className="sr-only">{open ? "Collapse panel" : "Expand panel"}</span>
          {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}
        </button>
      </div>

      <div role="tablist" aria-label="Panels" className={`${open ? "flex" : "hidden"} gap-1 border-b border-line px-3 pt-2 pb-2 lg:flex lg:px-4 lg:pt-4`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => {
              setTab(t.id);
              if (!open) onToggle();
            }}
            className={`h-9 flex-1 rounded-[var(--radius-control)] text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-accent text-accent-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className={`min-h-0 flex-1 overflow-y-auto p-4 ${open ? "" : "hidden lg:block"}`}
      >
        {tab === "design" ? <DesignPanel product={product} design={design} /> : null}
        {tab === "graphics" ? <GraphicsPanel product={product} design={design} /> : null}
        {tab === "colorways" ? <ColorwaysPanel product={product} /> : null}
        {tab === "export" ? <ExportPanel product={product} design={design} /> : null}
      </div>
    </aside>
  );
}
