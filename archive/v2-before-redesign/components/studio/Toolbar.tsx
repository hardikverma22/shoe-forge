"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Bookmark, Command, Redo2, Share2, ShoppingBag, Undo2 } from "lucide-react";
import { useStore } from "zustand";
import type { ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { useBag, bagCount } from "@/lib/bag/store";
import { copyShareLink, saveCurrent } from "@/lib/studio-actions";
import { IconButton, Button } from "@/components/ui/primitives";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useStudioUI } from "@/lib/design/ui-store";

export function Toolbar({ product, onCommand }: { product: ProductDef; onCommand: () => void }) {
  const design = useDesignStore((s) => s.design);
  const rename = useDesignStore((s) => s.rename);
  const count = useBag((s) => bagCount(s.items));
  const canUndo = useStore(useDesignStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useDesignStore.temporal, (s) => s.futureStates.length > 0);

  useEffect(() => {
    const onSave = () => {
      const d = useDesignStore.getState().design;
      if (d) void saveCurrent(d);
    };
    window.addEventListener("sf:save", onSave);
    return () => window.removeEventListener("sf:save", onSave);
  }, []);

  return (
    <header className="glass fixed inset-x-3 top-3 z-40 flex h-14 items-center gap-2 rounded-[var(--radius-panel)] px-3 md:px-4">
      <Link href="/" aria-label="Back to home" className="grid size-9 place-items-center rounded-[var(--radius-control)] hover:bg-ink/5">
        <ArrowLeft size={18} aria-hidden="true" />
      </Link>
      <div className="hidden sm:block">
        <Logo className="text-ink" />
      </div>
      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-line sm:block" />
      <p className="hidden text-sm text-ink-muted md:block">{product.name}</p>
      <label className="sr-only" htmlFor="design-name">
        Design name
      </label>
      <input
        id="design-name"
        key={design?.name ?? ""}
        defaultValue={design?.name ?? ""}
        maxLength={40}
        onBlur={(e) => rename(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] bg-transparent px-2 py-1 text-sm font-semibold outline-none focus-visible:bg-surface"
      />
      <div className="flex items-center gap-0.5">
        <IconButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={() => useDesignStore.temporal.getState().undo()}>
          <Undo2 size={18} aria-hidden="true" />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => useDesignStore.temporal.getState().redo()}>
          <Redo2 size={18} aria-hidden="true" />
        </IconButton>
      </div>
      <IconButton label="Command menu (Ctrl+K)" onClick={onCommand} className="hidden sm:grid">
        <Command size={18} aria-hidden="true" />
      </IconButton>
      <IconButton
        label="Save design to this browser"
        onClick={() => {
          const d = useDesignStore.getState().design;
          if (d) void saveCurrent(d);
        }}
        className="hidden sm:grid"
      >
        <Bookmark size={18} aria-hidden="true" />
      </IconButton>
      <div className="hidden md:block">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const d = useDesignStore.getState().design;
            if (d) void copyShareLink(d);
          }}
        >
          <Share2 size={16} aria-hidden="true" /> Copy link
        </Button>
      </div>
      <IconButton
        label="Copy link"
        onClick={() => {
          const d = useDesignStore.getState().design;
          if (d) void copyShareLink(d);
        }}
        className="md:hidden"
      >
        <Share2 size={18} aria-hidden="true" />
      </IconButton>
      <Link
        href="/bag"
        aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
        onClick={() => useStudioUI.getState().set({ placing: null })}
        className="relative grid size-9 place-items-center rounded-[var(--radius-control)] hover:bg-ink/5"
      >
        <ShoppingBag size={18} aria-hidden="true" />
        {count > 0 ? (
          <span className="tabular absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">
            {count}
          </span>
        ) : null}
      </Link>
      <ThemeToggle />
    </header>
  );
}
