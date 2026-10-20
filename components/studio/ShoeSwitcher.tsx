"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import type { ProductDef } from "@/lib/products/schema";

/** The shoe name in the studio header: opens a list of every shoe to switch to in place. */
export function ShoeSwitcher({ product }: { product: ProductDef }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    // Focus the current shoe so arrow keys start from there.
    root.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const links = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-shoe]") ?? []);
      const i = links.indexOf(document.activeElement as HTMLElement);
      links[(i + (e.key === "ArrowDown" ? 1 : links.length - 1)) % links.length]?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative hidden shrink-0 md:block">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`text-ink-muted hover:text-ink hover:bg-ink/6 inline-flex h-10 items-center gap-1 rounded-full px-3 ${open ? "bg-ink/6 text-ink" : ""}`}
      >
        <span className="spec">
          <span className="sr-only">Change shoe, now </span>
          {product.name}
        </span>
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          id={listId}
          className="border-line bg-surface absolute top-12 left-0 z-50 w-[22rem] origin-top-left overflow-hidden rounded-2xl border shadow-[0_24px_60px_-24px_rgb(5_6_26/0.45)] [animation:dialog-in_0.25s_var(--ease-out-expo)]"
        >
          <p className="spec text-ink-muted px-4 pt-3 pb-1 uppercase">Switch shoe</p>
          <ul className="max-h-[min(70svh,34rem)] overflow-y-auto p-1.5">
            {PRODUCTS.map((p) => {
              const current = p.id === product.id;
              return (
                <li key={p.id}>
                  <Link
                    href={`/studio/${p.id}`}
                    data-shoe
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`focus-visible:ring-accent flex items-center gap-3 rounded-xl p-1.5 pr-3 outline-none focus-visible:ring-2 ${current ? "bg-ink/6" : "hover:bg-ink/4"}`}
                  >
                    <span className="studio-sweep grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element -- small pre-rendered WebP */}
                      <img src={`/shoes/${p.id}.webp`} alt="" width={80} height={48} className="w-[88%]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{p.name}</span>
                      <span className="spec text-ink-muted block">
                        {p.brand} · {p.category}
                      </span>
                    </span>
                    {current ? <Check size={16} aria-label="Current shoe" className="text-accent shrink-0" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/shoes"
            onClick={() => setOpen(false)}
            className="border-line text-accent block border-t px-4 py-3 text-sm font-semibold hover:underline"
          >
            Browse the lineup
          </Link>
        </div>
      ) : null}
    </div>
  );
}
