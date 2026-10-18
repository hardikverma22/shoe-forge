"use client";

import { useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import type { ProductDef } from "@/lib/products/schema";
import type { Design } from "@/lib/design/types";
import { DesignPanel } from "./DesignPanel";
import { GraphicsPanel } from "./GraphicsPanel";
import { ColorwaysPanel } from "./ColorwaysPanel";
import { ExportPanel } from "./ExportPanel";
import { PartChips } from "./PartRail";

type Tab = "design" | "colorways" | "graphics" | "export";
const TABS: { id: Tab; label: string }[] = [
  { id: "design", label: "Part" },
  { id: "colorways", label: "Colorways" },
  { id: "graphics", label: "Graphics" },
  { id: "export", label: "Export" },
];

/** Right panel on desktop, bottom sheet on phones and tablets. */
export function SidePanel({
  product,
  design,
  open,
  onToggle,
}: {
  product: ProductDef;
  design: Design;
  open: boolean;
  onToggle: () => void;
}) {
  const [tab, setTab] = useState<Tab>("design");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    design: null,
    colorways: null,
    graphics: null,
    export: null,
  });

  const select = (t: Tab, focus = false) => {
    setTab(t);
    if (!open) onToggle();
    if (focus) tabRefs.current[t]?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
    select(next.id, true);
  };

  return (
    <aside
      aria-label="Design controls"
      className={`border-line bg-surface fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl border-t shadow-[0_-20px_50px_-30px_rgb(5_6_26/0.45)] transition-[height] duration-500 ease-[var(--ease-out-expo)] lg:static lg:z-auto lg:h-auto lg:w-[24rem] lg:shrink-0 lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none ${
        open ? "h-[64dvh]" : "h-[8.75rem]"
      }`}
    >
      <div className="flex flex-col gap-2.5 px-3 pt-2 lg:hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="mx-auto flex h-6 w-24 items-center justify-center rounded-full"
        >
          <span className="sr-only">{open ? "Collapse panel" : "Expand panel"}</span>
          <ChevronUp
            size={18}
            aria-hidden="true"
            className={`text-ink-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <PartChips product={product} design={design} />
      </div>

      <div
        role="tablist"
        aria-label="Panels"
        className="border-line flex gap-1 border-b px-3 py-2 lg:px-4 lg:pt-4 lg:pb-3"
      >
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => select(t.id)}
            className={`h-9 flex-1 cursor-pointer rounded-full text-[0.8125rem] font-bold transition-colors duration-200 ${
              tab === t.id ? "bg-ink text-paper" : "text-ink-muted hover:bg-ink/6 hover:text-ink"
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
        tabIndex={0}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-8 outline-none lg:px-5 ${open ? "" : "invisible lg:visible"}`}
      >
        {tab === "design" ? <DesignPanel product={product} design={design} /> : null}
        {tab === "colorways" ? <ColorwaysPanel product={product} /> : null}
        {tab === "graphics" ? <GraphicsPanel product={product} design={design} /> : null}
        {tab === "export" ? <ExportPanel product={product} design={design} /> : null}
      </div>
    </aside>
  );
}
