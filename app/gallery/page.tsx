"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button, IconButton } from "@/components/ui/primitives";
import { deleteSavedDesign, listSavedDesigns, renameSavedDesign, saveDesign, type SavedDesign } from "@/lib/design/saved";
import { getProduct } from "@/lib/products";
import { forgeRunner } from "@/lib/products/forge-runner";
import { encodeDesign } from "@/lib/design/codec";
import { toast } from "@/lib/toast";
import { Trash2, Copy, Pencil } from "lucide-react";

export default function GalleryPage() {
  const [items, setItems] = useState<SavedDesign[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const refresh = async () => {
    const list = await listSavedDesigns();
    setItems(list);
    const next: Record<string, string> = {};
    for (const i of list) if (i.thumbnail) next[i.id] = URL.createObjectURL(i.thumbnail);
    setUrls((old) => {
      Object.values(old).forEach((u) => URL.revokeObjectURL(u));
      return next;
    });
  };

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-14 px-5 py-12 md:px-10">
        <section aria-labelledby="colorways-heading" className="space-y-5">
          <h1 id="colorways-heading" className="font-display text-6xl font-black">Gallery</h1>
          <p className="text-ink-muted">Start from a colorway, or open one of your saved designs below.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {forgeRunner.colorways.map((c) => {
              const link = `/studio/${forgeRunner.id}?d=${encodeDesign({
                version: 1,
                productId: forgeRunner.id,
                name: c.name,
                stage: "studio",
                graphics: [],
                parts: Object.fromEntries(forgeRunner.parts.map((p) => [p.id, { ...p.default, ...c.parts[p.id] }])),
              }).value}`;
              return (
                <li key={c.id}>
                  <Link href={link} className="block rounded-[var(--radius-panel)] border border-line bg-surface p-5 transition-colors hover:border-accent">
                    <p className="font-display text-2xl font-extrabold">{c.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{c.story}</p>
                    <span className="mt-4 flex gap-1">
                      {Object.values(c.parts).slice(0, 5).map((p, i) => (
                        <span key={i} className="size-5 rounded-full border border-line" style={{ background: p?.color }} />
                      ))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="mine-heading" className="space-y-5">
          <h2 id="mine-heading" className="font-display text-4xl font-extrabold">My designs</h2>
          {items === null ? <p className="text-ink-muted">Loading…</p> : null}
          {items?.length === 0 ? (
            <div className="space-y-3">
              <p className="text-ink-muted">Designs you save appear here.</p>
              <Link href="/studio/forge-runner" className="underline underline-offset-4">
                Start designing
              </Link>
            </div>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
                <div className="grid aspect-[4/3] place-items-center bg-paper">
                  {urls[item.id] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={urls[item.id]} alt="" className="size-full object-contain" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-line p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.design.name}</p>
                    <p className="text-xs text-ink-muted">{getProduct(item.design.productId)?.name ?? item.design.productId}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/studio/${item.design.productId}?saved=${item.id}`} className="rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/10">
                      Open
                    </Link>
                    <IconButton
                      label="Rename"
                      onClick={async () => {
                        const name = window.prompt("New name", item.design.name);
                        if (name) {
                          await renameSavedDesign(item.id, name);
                          await refresh();
                        }
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label="Duplicate"
                      onClick={async () => {
                        await saveDesign({ ...item.design, name: `${item.design.name} copy` }, item.thumbnail);
                        toast.success("Duplicated");
                        await refresh();
                      }}
                    >
                      <Copy size={16} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label="Delete"
                      onClick={async () => {
                        if (!window.confirm(`Delete “${item.design.name}”? This can't be undone.`)) return;
                        await deleteSavedDesign(item.id);
                        toast.info("Deleted");
                        await refresh();
                      }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" onClick={() => void refresh()}>
            Refresh
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
