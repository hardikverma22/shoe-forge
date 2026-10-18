"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/primitives";
import type { ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { generateColorway } from "@/lib/design/colorways";
import { copyShareLink, exportPng, saveCurrent } from "@/lib/studio-actions";
import { toast } from "@/lib/toast";

type Item = { id: string; group: string; label: string; run: () => void };

export function CommandMenu({
  product,
  open,
  onClose,
  onShowShortcuts,
}: {
  product: ProductDef;
  open: boolean;
  onClose: () => void;
  onShowShortcuts: () => void;
}) {
  const [query, setQuery] = useState("");

  const items = useMemo<Item[]>(() => {
    const close = (fn: () => void) => () => {
      onClose();
      fn();
    };
    const set = useStudioUI.getState().set;
    const list: Item[] = [];
    for (const p of product.parts) {
      list.push({ id: `part-${p.id}`, group: "Parts", label: `Select ${p.label}`, run: close(() => set({ selectedPart: p.id })) });
    }
    for (const c of product.colorways) {
      list.push({
        id: `cw-${c.id}`,
        group: "Colorways",
        label: `Apply ${c.name}`,
        run: close(() => {
          useDesignStore.getState().applyParts(c.parts);
          toast.success(`${c.name} applied`);
        }),
      });
    }
    list.push({
      id: "surprise",
      group: "Colorways",
      label: "Surprise me",
      run: close(() => useDesignStore.getState().applyParts(generateColorway(product))),
    });
    for (const v of product.cameraViews) {
      list.push({
        id: `view-${v.id}`,
        group: "Views",
        label: `View: ${v.label}`,
        run: close(() => set({ view: v.id, cameraNonce: useStudioUI.getState().cameraNonce + 1 })),
      });
    }
    list.push({
      id: "export-png",
      group: "Export",
      label: "Download PNG (2×)",
      run: close(() => {
        const d = useDesignStore.getState().design;
        if (d) void exportPng(d, 2, false);
      }),
    });
    list.push({
      id: "copy",
      group: "Export",
      label: "Copy share link",
      run: close(() => {
        const d = useDesignStore.getState().design;
        if (d) void copyShareLink(d);
      }),
    });
    list.push({
      id: "save",
      group: "Export",
      label: "Save design",
      run: close(() => {
        const d = useDesignStore.getState().design;
        if (d) void saveCurrent(d);
      }),
    });
    list.push({ id: "shortcuts", group: "Help", label: "Keyboard shortcuts", run: close(onShowShortcuts) });
    return list;
  }, [product, onClose, onShowShortcuts]);

  const filtered = items.filter((i) => `${i.group} ${i.label}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} title="Command menu">
      <label className="sr-only" htmlFor="command-search">
        Search commands
      </label>
      <input
        id="command-search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a command"
        className="mb-4 h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 outline-none focus-visible:border-accent"
      />
      <ul className="space-y-1" role="listbox" aria-label="Commands">
        {filtered.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={i.run}
              className="flex w-full items-center justify-between rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm hover:bg-ink/5 focus-visible:bg-ink/5"
            >
              <span>{i.label}</span>
              <span className="text-xs text-ink-muted">{i.group}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 ? <li className="px-3 py-2 text-sm text-ink-muted">No matching commands.</li> : null}
      </ul>
    </Dialog>
  );
}

const SHORTCUTS: [string, string][] = [
  ["Ctrl/⌘ + K", "Command menu"],
  ["Ctrl/⌘ + Z", "Undo"],
  ["Ctrl/⌘ + Shift + Z", "Redo"],
  ["Ctrl/⌘ + S", "Save design"],
  ["[ and ]", "Previous and next part"],
  ["1 to 6", "Camera views"],
  ["R", "Surprise me"],
  ["Space", "Auto-rotate on and off"],
  ["Delete", "Remove the selected graphic"],
  ["Esc", "Cancel placing and clear selection"],
  ["?", "This list"],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3 text-sm">
        {SHORTCUTS.map(([keys, what]) => (
          <div key={keys} className="contents">
            <dt className="tabular font-semibold">{keys}</dt>
            <dd className="text-ink-muted">{what}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
