"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Bookmark, ChevronDown, Command, Link2, Redo2, Undo2 } from "lucide-react";
import { useStore } from "zustand";
import type { ProductDef } from "@/lib/products/schema";
import { useDesignStore } from "@/lib/design/store";
import { copyShareLink, saveCurrent } from "@/lib/studio-actions";
import { IconButton, Button } from "@/components/ui/primitives";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export function Toolbar({ product, onCommand }: { product: ProductDef; onCommand: () => void }) {
  const design = useDesignStore((s) => s.design);
  const rename = useDesignStore((s) => s.rename);
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

  const save = () => {
    const d = useDesignStore.getState().design;
    if (d) void saveCurrent(d);
  };
  const share = () => {
    const d = useDesignStore.getState().design;
    if (d) void copyShareLink(d);
  };

  return (
    <header className="border-line bg-surface relative z-40 flex h-16 shrink-0 items-center gap-1 border-b px-2 sm:gap-2 sm:px-4">
      <Link
        href="/shoes"
        aria-label="All shoes"
        className="hover:bg-ink/6 grid size-10 shrink-0 place-items-center rounded-full lg:hidden"
      >
        <ArrowLeft size={18} aria-hidden="true" />
      </Link>
      <div className="hidden shrink-0 lg:block">
        <Logo />
      </div>
      <span aria-hidden="true" className="bg-line mx-2 hidden h-7 w-px lg:block" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href="/shoes"
          title="Change shoe"
          className="hover:bg-ink/6 text-ink-muted hover:text-ink hidden h-10 shrink-0 items-center gap-1 rounded-full px-3 md:inline-flex"
        >
          <span className="spec">
            <span className="sr-only">Change shoe, now </span>
            {product.name}
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </Link>
        <span aria-hidden="true" className="text-ink-muted hidden md:inline">/</span>
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
            if (e.key === "Escape") {
              e.currentTarget.value = design?.name ?? "";
              e.currentTarget.blur();
            }
          }}
          title="Rename this design"
          className="hover:bg-ink/4 focus-visible:bg-surface-2 focus-visible:ring-accent h-10 min-w-0 flex-1 truncate rounded-full bg-transparent px-3 text-[0.9375rem] font-bold outline-none focus-visible:ring-2 md:max-w-xs"
        />
      </div>

      <div className="flex items-center">
        <IconButton
          label="Undo"
          shortcut="Control+Z"
          disabled={!canUndo}
          onClick={() => useDesignStore.temporal.getState().undo()}
        >
          <Undo2 size={18} aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Redo"
          shortcut="Control+Shift+Z"
          disabled={!canRedo}
          onClick={() => useDesignStore.temporal.getState().redo()}
        >
          <Redo2 size={18} aria-hidden="true" />
        </IconButton>
      </div>
      <span aria-hidden="true" className="bg-line mx-1 hidden h-7 w-px sm:block" />
      <IconButton label="Command menu" shortcut="Control+K" onClick={onCommand}>
        <Command size={18} aria-hidden="true" />
      </IconButton>
      <span className="hidden sm:contents">
        <ThemeToggle />
      </span>
      <span className="hidden md:contents">
        <Button variant="outline" onClick={share}>
          <Link2 size={16} aria-hidden="true" /> Copy link
        </Button>
      </span>
      <IconButton label="Copy link" onClick={share} className="md:hidden">
        <Link2 size={18} aria-hidden="true" />
      </IconButton>
      <span className="hidden sm:contents">
        <Button variant="primary" onClick={save}>
          <Bookmark size={16} aria-hidden="true" /> Save
        </Button>
      </span>
      <IconButton label="Save design" onClick={save} className="sm:hidden">
        <Bookmark size={18} aria-hidden="true" />
      </IconButton>
    </header>
  );
}
