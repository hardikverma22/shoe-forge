"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/primitives";
import type { ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { useStudioUI } from "@/lib/design/ui-store";
import { generateColorway } from "@/lib/design/colorways";
import { copyShareLink, exportPng, saveCurrent } from "@/lib/studio-actions";
import { toast } from "@/lib/toast";
import { pickPart } from "./PartRail";

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
      list.push({
        id: `part-${p.id}`,
        group: "Parts",
        label: `Select ${p.label}`,
        run: close(() => pickPart(p.id)),
      });
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
    list.push({
      id: "shortcuts",
      group: "Help",
      label: "Keyboard shortcuts",
      run: close(onShowShortcuts),
    });
    return list;
  }, [product, onClose, onShowShortcuts]);

  const filtered = items.filter((i) =>
    `${i.group} ${i.label}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

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
        className="border-line bg-surface-2 focus-visible:border-accent mb-4 h-12 w-full rounded-full border px-5 text-base outline-none"
      />
      <ul className="space-y-1" role="listbox" aria-label="Commands">
        {filtered.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={i.run}
              className="hover:bg-ink/6 focus-visible:bg-ink/6 flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold"
            >
              <span>{i.label}</span>
              <span className="spec text-ink-muted">{i.group}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="text-ink-muted px-3 py-2 text-sm">No matching commands.</li>
        ) : null}
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
  ["Space", "Turntable on and off"],
  ["R", "Surprise me"],
  ["Delete", "Remove the selected graphic"],
  ["Esc", "Cancel placing and clear selection"],
  ["?", "This list"],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        {SHORTCUTS.map(([keys, what]) => (
          <div key={keys} className="contents">
            <dt className="spec font-bold">{keys}</dt>
            <dd className="text-ink-muted">{what}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
