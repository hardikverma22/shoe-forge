"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { CATEGORIES, type ProductDef } from "@/lib/products/schema";

const FILTERS = ["All", ...CATEGORIES.filter((c) => PRODUCTS.some((p) => p.category === c))] as const;

function ShoeCard({ product, priority }: { product: ProductDef; priority: boolean }) {
  return (
    <li>
      <Link
        href={`/studio/${product.id}`}
        className="group focus-visible:ring-accent block rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div className="sweep relative grid aspect-[5/3] place-items-center overflow-hidden rounded-[1.25rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered transparent WebP, already sized */}
          <img
            src={`/shoes/${product.id}.webp`}
            alt=""
            width={1200}
            height={720}
            loading={priority ? "eager" : "lazy"}
            className="w-[86%] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:-rotate-2 motion-reduce:transition-none"
          />
          <span className="bg-night text-sheet absolute right-3 bottom-3 inline-flex translate-y-1 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            Customize <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 px-1">
          <div className="min-w-0">
            <p className="spec text-ink-muted uppercase">
              {product.brand} · {product.category}
            </p>
            <h3 className="mt-1 text-lg leading-tight font-bold">{product.name}</h3>
            <p className="text-ink-muted mt-0.5 text-sm">{product.parts.length} parts to design</p>
          </div>
        </div>
      </Link>
    </li>
  );
}

/** The lineup, filterable by category. */
export function ShoeGrid({ headingId }: { headingId?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = filter === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  return (
    <div>
      <div role="group" aria-label="Filter by category" aria-describedby={headingId} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {FILTERS.map((f) => {
          const count = f === "All" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === f).length;
          const on = f === filter;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${on ? "bg-ink text-paper" : "border-line text-ink hover:bg-ink/5 border"}`}
            >
              {f} <span className={`spec ${on ? "text-paper/70" : "text-ink-muted"}`}>{count}</span>
            </button>
          );
        })}
      </div>
      <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((p, i) => (
          <ShoeCard key={p.id} product={p} priority={i < 4} />
        ))}
      </ul>
    </div>
  );
}

/** Who made each 3D model, as their licenses ask. */
export function ModelCredits() {
  const credited = PRODUCTS.filter((p) => p.credit);
  return (
    <section aria-labelledby="credits-title" className="border-line mt-20 border-t pt-8">
      <h2 id="credits-title" className="text-sm font-bold">
        3D model credits
      </h2>
      <ul className="text-ink-muted mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {credited.map((p) => (
          <li key={p.id}>
            {p.name}:{" "}
            <a className="text-ink underline-offset-2 hover:underline" href={p.credit!.url} rel="noopener noreferrer" target="_blank">
              {p.credit!.author}
            </a>
            , {p.credit!.license}
          </li>
        ))}
      </ul>
      <p className="text-ink-muted mt-4 max-w-2xl text-sm">
        Shoe Forge is a fan project. It is not affiliated with, sponsored or endorsed by Nike, Jordan, adidas, PUMA, Vans or
        Converse. Their names and marks belong to them.
      </p>
    </section>
  );
}
