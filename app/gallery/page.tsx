"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Pencil, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button, Dialog, IconButton } from "@/components/ui/primitives";
import { Toaster } from "@/components/ui/Toaster";
import {
  deleteSavedDesign,
  listSavedDesigns,
  renameSavedDesign,
  saveDesign,
  type SavedDesign,
} from "@/lib/design/saved";
import { getProduct } from "@/lib/products";
import { forgeRunner } from "@/lib/products/forge-runner";
import { designFromColorway, stockFor, studioHref } from "@/lib/design/presentation";
import { toast } from "@/lib/toast";

function SavedCard({
  item,
  url,
  onChange,
  onDelete,
}: {
  item: SavedDesign;
  url?: string;
  onChange: () => Promise<void>;
  onDelete: (item: SavedDesign) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.design.name);
  const product = getProduct(item.design.productId);
  const colors = product
    ? product.parts.map((p) => item.design.parts[p.id]?.color).filter(Boolean)
    : [];

  const commit = async () => {
    setEditing(false);
    const next = name.trim();
    if (next && next !== item.design.name) {
      await renameSavedDesign(item.id, next);
      await onChange();
    } else setName(item.design.name);
  };

  return (
    <li className="group border-line bg-surface overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_24px_50px_-30px_rgb(30_43_255/0.5)]">
      <Link
        href={`/studio/${item.design.productId}?saved=${item.id}`}
        className="drafting relative grid aspect-[4/3] place-items-center"
        aria-label={`Open ${item.design.name}`}
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt=""
            className="size-full object-contain transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="spec text-ink-muted">No preview</span>
        )}
        <span className="absolute right-3 bottom-3 flex -space-x-1" aria-hidden="true">
          {colors.slice(0, 6).map((c, i) => (
            <span
              key={i}
              className="border-surface size-5 rounded-full border-2"
              style={{ background: c }}
            />
          ))}
        </span>
      </Link>
      <div className="border-line flex items-center justify-between gap-2 border-t p-3 pl-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void commit();
              }}
              className="flex items-center gap-1"
            >
              <label htmlFor={`name-${item.id}`} className="sr-only">
                Design name
              </label>
              <input
                id={`name-${item.id}`}
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => void commit()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setName(item.design.name);
                    setEditing(false);
                  }
                }}
                className="border-accent bg-surface-2 h-9 min-w-0 flex-1 rounded-full border px-3 text-sm font-bold outline-none"
              />
              <IconButton label="Save name" type="submit">
                <Check size={16} aria-hidden="true" />
              </IconButton>
            </form>
          ) : (
            <>
              <p className="truncate font-bold">{item.design.name}</p>
              <p className="spec text-ink-muted">{product?.name ?? item.design.productId}</p>
            </>
          )}
        </div>
        {!editing ? (
          <div className="flex items-center">
            <IconButton label="Rename" onClick={() => setEditing(true)}>
              <Pencil size={16} aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Duplicate"
              onClick={async () => {
                await saveDesign(
                  { ...item.design, name: `${item.design.name} copy`.slice(0, 40) },
                  item.thumbnail,
                );
                toast.success("Duplicated");
                await onChange();
              }}
            >
              <Copy size={16} aria-hidden="true" />
            </IconButton>
            <IconButton label="Delete" onClick={() => onDelete(item)} className="hover:text-danger">
              <Trash2 size={16} aria-hidden="true" />
            </IconButton>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function GalleryPage() {
  const [items, setItems] = useState<SavedDesign[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<SavedDesign | null>(null);

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
    <div className="bg-paper min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-[92rem] space-y-20 px-5 pt-10 pb-24 md:px-10">
        <section aria-labelledby="mine-heading" className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <h1 id="mine-heading" className="display text-[clamp(3.5rem,8vw,7rem)]">
                My designs
              </h1>
              <p className="text-ink-muted max-w-lg text-lg">
                Pairs you save in the studio live here, in this browser. Nothing is uploaded.
              </p>
            </div>
            <Link
              href="/studio/forge-runner"
              className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-full px-6 font-bold"
            >
              New design <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>

          {items === null ? (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading saved designs"
            >
              {[0, 1, 2].map((i) => (
                <li key={i} className="bg-line/60 aspect-[4/3.6] animate-pulse rounded-2xl" />
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="border-line flex flex-col items-start gap-4 rounded-2xl border border-dashed p-8 md:p-12">
              <p className="display text-[2.5rem]">Nothing saved yet</p>
              <p className="text-ink-muted max-w-md">
                Design a pair, then press Save in the studio (or Ctrl/⌘ + S). It shows up here with
                a picture.
              </p>
              <Link href="/studio/forge-runner" className="text-accent font-bold underline">
                Start designing
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <SavedCard
                  key={item.id}
                  item={item}
                  url={urls[item.id]}
                  onChange={refresh}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="colorways-heading" className="space-y-6">
          <h2 id="colorways-heading" className="display text-[clamp(2.5rem,5vw,4rem)]">
            Or start from a colorway
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {forgeRunner.colorways.map((c) => {
              const stock = stockFor(c);
              return (
                <li key={c.id}>
                  <Link
                    href={studioHref(designFromColorway(forgeRunner, c))}
                    className="group flex h-full min-h-44 flex-col justify-between gap-6 rounded-2xl p-5 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1"
                    style={{ background: stock.field, color: stock.ink }}
                  >
                    <span className="flex -space-x-1.5" aria-hidden="true">
                      {Object.values(c.parts)
                        .slice(0, 5)
                        .map((p, i) => (
                          <span
                            key={i}
                            className="size-7 rounded-full border-[1.5px]"
                            style={{ background: p?.color, borderColor: stock.ink }}
                          />
                        ))}
                    </span>
                    <span>
                      <span className="display flex items-center justify-between text-[2rem]">
                        {c.name}
                        <ArrowUpRight
                          size={20}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                      <span className="mt-1 block text-sm">{c.story}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <SiteFooter />

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this design?"
      >
        <p className="text-ink-muted">
          “{pendingDelete?.design.name}” will be removed from this browser. This can&apos;t be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!pendingDelete) return;
              await deleteSavedDesign(pendingDelete.id);
              setPendingDelete(null);
              toast.info("Design deleted");
              await refresh();
            }}
          >
            <Trash2 size={16} aria-hidden="true" /> Delete design
          </Button>
        </div>
      </Dialog>
      <Toaster />
    </div>
  );
}
